import { type ActFn, ObjectId } from "lesan";
import {
  purchasingRequest,
  processStep,
  stepApproval,
  coreApp,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";
import { resolveProcessForPR } from "../../../utils/resolveProcess.ts";

export const submitFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const { activeRoleId, _id, requestingUnitId: overrideUnitId } = set;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  );

  const now = new Date();
  const prId = new ObjectId(_id as string);

  // 1. Fetch Draft PR
  const pr = await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: {
      _id: 1,
      status: 1,
      title: 1,
      quantity: 1,
      selectionType: 1,
      selectedTenderOfferId: 1,
      stuff: { _id: 1 },
      wareModel: { _id: 1, name: 1, enName: 1 },
      requestingUnit: { _id: 1, name: 1 },
    },
  }) as Record<string, unknown>;

  if (!pr) {
    throwError("Purchasing request not found");
    return;
  }

  if (pr.status !== "Draft") {
    throwError("Only Draft purchasing requests can be submitted");
    return;
  }

  // Validate that at least one selection method exists
  const prStuff = pr.stuff as Record<string, unknown> | undefined;
  const hasStuff = !!(prStuff?._id);
  const hasTenderOffer = !!pr.selectedTenderOfferId;

  if (!hasStuff && !hasTenderOffer) {
    throwError("Please assign stuff or select a tender offer before submitting this request");
    return;
  }

  const prWareModel = pr.wareModel as Record<string, unknown> | undefined;
  const wareModelId = prWareModel?._id?.toString();

  if (!wareModelId) {
    throwError("Purchasing request has no ware model");
    return;
  }

  // 2. Derive organization
  const userAny = user as Record<string, unknown>;
  const userOrgs = userAny.organizations as Array<Record<string, unknown>> | undefined;
  if (!userOrgs || userOrgs.length === 0) {
    throwError("Could not determine organization. Please ensure you belong to an organization.");
    return;
  }
  const orgId = (userOrgs[0]._id as ObjectId).toString();

  // 3. Derive requesting unit
  const requestingUnitId = overrideUnitId
    ? (overrideUnitId as string)
    : (activeRole?.scopeType === "unit" && activeRole?.scopeId
        ? activeRole.scopeId
        : undefined);

  if (!requestingUnitId) {
    throwError("Your active role does not have an associated unit.");
    return;
  }

  // 4. Validate submitter's unit matches PR's requesting unit
  const prRequestingUnitId = (pr.requestingUnit as Record<string, unknown>)?._id?.toString();
  if (prRequestingUnitId && requestingUnitId !== prRequestingUnitId) {
    throwError("You can only submit purchase requests for your own unit");
    return;
  }

  // 5. Resolve process
  const resolvedProcessId = await resolveProcessForPR({
    organizationId: orgId,
    requestingUnitId,
    wareModelId,
  });

  // 6. Link process to PR
  await purchasingRequest.addRelation({
    filters: { _id: prId },
    relations: {
      process: {
        _ids: new ObjectId(resolvedProcessId),
        relatedRelations: { requests: true },
      },
    },
    projection: { _id: 1 },
    replace: true,
  });

  // 7. Create StepApprovals for first step
  const steps = await processStep.aggregation({
    pipeline: [
      { $match: { "process._id": new ObjectId(resolvedProcessId) } },
      { $sort: { order: 1 } },
      { $limit: 1 },
    ],
    projection: { _id: 1, assigneeGroups: 1 },
  }).toArray();

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
            _ids: prId,
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

  // 8. Update PR status and push history
  await purchasingRequest.findOneAndUpdate({
    filter: { _id: prId },
    update: {
      $set: {
        status: "Pending",
        currentStep: 0,
        requestedAt: now,
        updatedAt: now,
      },
      $push: {
        history: {
          action: "submitted",
          performed: {
            by: user._id.toString(),
            name: `${user.first_name} ${user.last_name}`,
            at: now,
            role: activeRole
              ? {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              }
              : { id: "", name: "" },
          },
          details: {
            status: "Pending",
            currentStep: 0,
            processId: resolvedProcessId,
          },
        },
      },
    },
    projection: { _id: 1 },
  });

  return await purchasingRequest.findOne({
    filters: { _id: prId },
    projection: get,
  });
};
