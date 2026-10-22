import { type ActFn, ObjectId } from "lesan";
import {
  coreApp,
  processStep,
  purchasingRequest,
  stepApproval,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { assertWareModelAccess } from "../../../utils/checkWareModelAccess.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertUnitInActorScope } from "../../../utils/unitScope.ts";
import { resolveProcessForPR } from "../../../utils/resolveProcess.ts";
import {
  assertCanWritePurchasingRequest,
  loadPurchasingRequestForActor,
} from "../readScope.ts";

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

export const submitFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const { activeRoleId, _id, requestingUnitId: overrideUnitId } = set;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as ActiveRole | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  const now = new Date();
  const prId = new ObjectId(_id as string);

  // 1. Load and authorize the purchasing request
  const pr = await loadPurchasingRequestForActor(activeRole, user, _id);
  assertCanWritePurchasingRequest(activeRole, user, pr);

  if (pr.status !== "Draft") {
    throwError("Only Draft purchasing requests can be submitted");
    return;
  }

  if (!isManagerLike(activeRole) && !user.isGhost) {
    const prRequestingUnitId = normalizeId(pr.requestingUnit?._id);
    const override = normalizeId(overrideUnitId);

    if (!prRequestingUnitId) {
      throwError("You cant do this");
      return;
    }

    if (override && override !== prRequestingUnitId) {
      throwError("You cant do this");
      return;
    }

    await assertUnitInActorScope(user, activeRole, prRequestingUnitId);
  }

  // Validate that at least one selection method exists
  const prStuff = pr.stuff as Record<string, unknown> | undefined;
  const hasStuff = !!(prStuff?._id);
  const hasTenderOffer = !!pr.selectedTenderOfferId;

  if (!hasStuff && !hasTenderOffer) {
    throwError(
      "Please assign stuff or select a tender offer before submitting this request",
    );
    return;
  }

  const prWareModel = pr.wareModel as Record<string, unknown> | undefined;
  const wareModelId = prWareModel?._id?.toString();

  if (!wareModelId) {
    throwError("Purchasing request has no ware model");
    return;
  }

  await assertWareModelAccess(user, activeRole, {
    _id: wareModelId,
    wareType: pr.wareType as { _id?: unknown },
    wareClass: pr.wareClass as { _id?: unknown },
    wareGroup: pr.wareGroup as { _id?: unknown },
  });

  // 2. Derive organization from the purchasing request
  const organizationId = normalizeId(pr.organization?._id);
  if (!organizationId) {
    throwError(
      "Could not determine organization. Please ensure the purchasing request belongs to an organization.",
    );
    return;
  }

  // 3. Derive requesting unit from the purchasing request
  const requestingUnitId = normalizeId(pr.requestingUnit?._id) ??
    normalizeId(overrideUnitId);

  if (!requestingUnitId) {
    throwError("Your active role does not have an associated unit.");
    return;
  }

  // 4. Resolve process
  const resolvedProcessId = await resolveProcessForPR({
    organizationId,
    requestingUnitId,
    wareModelId,
  });

  // 5. Link process to PR
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

  // 6. Create StepApprovals for first step
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
    const unitIds = [
      ...new Set<string>(
        firstStep.assigneeGroups.flatMap(
          (g: { unitIds: string[] }) => g.unitIds,
        ),
      ),
    ];
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

  // 7. Update PR status and push history
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
            role: {
              id: activeRole.roleId,
              name: activeRole.name,
              scopeType: activeRole.scopeType,
              scopeId: activeRole.scopeId,
            },
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
