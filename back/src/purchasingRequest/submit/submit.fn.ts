import { type ActFn, ObjectId } from "lesan";
import {
  purchasingRequest,
  processStep,
  stepApproval,
  budgetEncumbrance,
  budgetLine,
  coreApp,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const submitFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const { activeRoleId, processId, requestingUnitId, attachmentIds, budgetLineId, wareModelId, ...rest } =
    set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

  const now = new Date();
  const relations: Record<string, unknown> = {
    process: {
      _ids: new ObjectId(processId as string),
      relatedRelations: { requests: true },
    },
    requester: {
      _ids: user._id,
      relatedRelations: { requests: true },
    },
    wareModel: {
      _ids: new ObjectId(wareModelId as string),
      relatedRelations: { purchasingRequests: true },
    },
  };

  if (requestingUnitId) {
    relations.requestingUnit = {
      _ids: new ObjectId(requestingUnitId as string),
      relatedRelations: { purchaseRequests: true },
    };
  }

  if (attachmentIds && (attachmentIds as string[]).length > 0) {
    relations.attachments = {
      _ids: (attachmentIds as string[]).map((id: string) => new ObjectId(id)),
      relatedRelations: {},
    };
  }

  if (budgetLineId) {
    relations.budgetLine = {
      _ids: new ObjectId(budgetLineId as string),
      relatedRelations: { purchasingRequests: true },
    };
  }

  const createdRequest = await purchasingRequest.insertOne({
    doc: {
      ...rest,
      status: "Pending",
      currentStep: 0,
      requestedAt: now,
    },
    relations,
    projection: { _id: 1, status: 1, currentStep: 1 },
  });

  const steps = await processStep.aggregation({
    pipeline: [
      { $match: { "process._id": new ObjectId(processId as string) } },
      { $sort: { order: 1 } },
      { $limit: 1 },
    ],
    projection: { _id: 1, assigneeGroups: 1 },
  }).toArray();

  if (!createdRequest) {
    throwError("Failed to create purchasing request");
    return;
  }

  // Push "submitted" history entry
  await purchasingRequest.findOneAndUpdate({
    filter: { _id: createdRequest._id },
    update: {
      $push: {
        history: {
          action: "submitted",
          performed: {
            by: user._id.toString(),
            name: `${user.first_name} ${user.last_name}`,
            at: now,
            role: activeRole ? {
              id: activeRole.roleId,
              name: activeRole.name,
              scopeType: activeRole.scopeType,
              scopeId: activeRole.scopeId,
            } : { id: "", name: "" },
          },
          details: { status: "Pending", currentStep: 0 },
        },
      },
    },
    projection: { _id: 1 },
  });

  if (steps.length > 0) {
    const firstStep = steps[0];
    const unitIds = [...new Set<string>(
      firstStep.assigneeGroups.flatMap(
        (g: { unitIds: string[] }) => g.unitIds,
      ),
    )];
    for (const unitId of unitIds) {
      await stepApproval.insertOne({
        doc: { status: "pending" },
        projection: { _id: 1 },
        relations: {
          purchasingRequest: {
            _ids: createdRequest._id,
            relatedRelations: { stepApprovals: true },
          },
          processStep: {
            _ids: firstStep._id,
            relatedRelations: { approvals: true },
          },
          unit: {
            _ids: new ObjectId(unitId),
            relatedRelations: { stepApprovals: true },
          },
        },
      });
    }
  }

  // Auto-create budget encumbrance if budgetLineId is provided
  if (budgetLineId && rest.estimatedAmount) {
    const amount = rest.estimatedAmount as number;
    const budgetLineDoc = await budgetLine.findOne({
      filters: { _id: new ObjectId(budgetLineId as string) },
      projection: { _id: 1, remainingBudget: 1 },
    });

    if (budgetLineDoc) {
      const remaining = (budgetLineDoc as Record<string, unknown>).remainingBudget as number;
      if (remaining < amount) {
        throwError("Insufficient remaining budget");
        return;
      }

      await budgetEncumbrance.insertOne({
        doc: {
          amount,
          status: "reserved",
          referenceType: "purchasingRequest",
          referenceId: createdRequest._id.toString(),
          description: `Auto-encumbrance for PR: ${rest.title || ""}`,
        },
        projection: { _id: 1 },
        relations: {
          budgetLine: {
            _ids: new ObjectId(budgetLineId as string),
            relatedRelations: { encumbrances: true },
          },
          createdBy: {
            _ids: user._id,
            relatedRelations: { budgetEncumbrances: true },
          },
        },
      });
    }
  }

  return await purchasingRequest.findOne({
    filters: { _id: createdRequest._id },
    projection: get,
  });
};
