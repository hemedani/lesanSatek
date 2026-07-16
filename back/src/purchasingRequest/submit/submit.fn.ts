import { type ActFn, ObjectId } from "lesan";
import {
  purchasingRequest,
  processStep,
  stepApproval,
  purchaseOrderItem,
  stuff,
  ware,
  tender,
  coreApp,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";
import { resolveProcessForPR } from "../../../utils/resolveProcess.ts";

export const submitFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const { activeRoleId, _id, storeId, requestingUnitId: overrideUnitId } = set;

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

  const prWareModel = pr.wareModel as Record<string, unknown> | undefined;
  const wareModelId = prWareModel?._id?.toString();
  const wareModelName = (prWareModel?.name as string) || "";
  const quantity = pr.quantity as number || 0;

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

  // 5. Tender check — if a tender exists, it must be awarded
  const existingTender = await tender.findOne({
    filters: { "purchasingRequest._id": prId },
    projection: { _id: 1, status: 1 },
  }) as Record<string, unknown> | null;

  if (existingTender) {
    const tenderStatus = existingTender.status as string;
    if (tenderStatus !== "awarded") {
      throwError(
        `Cannot submit: the linked tender is ${tenderStatus}. It must be awarded first.`,
      );
      return;
    }
  }

  // 6. Store assignment (optional) — create PurchaseOrderItem
  if (storeId) {
    let unitPrice: number | undefined;

    const stuffDoc = await stuff.aggregation({
      pipeline: [
        {
          $match: {
            "store._id": new ObjectId(storeId as string),
            "wareModel._id": new ObjectId(wareModelId),
          },
        },
        { $limit: 1 },
      ],
      projection: { price: 1, hasAbsolutePrice: 1, pricePercentage: 1, ware: { _id: 1 } },
    }).toArray();

    if (stuffDoc.length > 0) {
      const s = stuffDoc[0] as Record<string, unknown>;
      if (s.hasAbsolutePrice) {
        unitPrice = s.price as number;
      } else if (s.pricePercentage) {
        const wareDoc = await ware.findOne({
          filters: { _id: new ObjectId((s.ware as Record<string, unknown>)?._id as string) },
          projection: { price: 1 },
        }) as Record<string, unknown>;
        if (wareDoc) {
          unitPrice = (wareDoc.price as number) * (1 + (s.pricePercentage as number) / 100);
        }
      }
    }

    const poRelations: Record<string, unknown> = {
      purchasingRequest: {
        _ids: prId,
        relatedRelations: { purchaseOrderItems: true },
      },
      wareModel: {
        _ids: new ObjectId(wareModelId),
        relatedRelations: { purchaseOrderItems: true },
      },
      assignedBy: {
        _ids: user._id,
        relatedRelations: {},
      },
    };

    if (storeId) {
      poRelations.assignedFrom = {
        _ids: new ObjectId(storeId as string),
        relatedRelations: { purchaseOrderItems: true },
      };
    }

    await purchaseOrderItem.insertOne({
      doc: {
        quantity,
        unitPrice,
        totalPrice: unitPrice ? unitPrice * quantity : undefined,
        status: "assigned",
      },
      relations: poRelations,
      projection: { _id: 1 },
    });

    // Link store to the PR
    await purchasingRequest.addRelation({
      filters: { _id: prId },
      relations: {
        store: {
          _ids: new ObjectId(storeId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: { _id: 1 },
      replace: true,
    });

    // Push item_assigned history
    await purchasingRequest.findOneAndUpdate({
      filter: { _id: prId },
      update: {
        $push: {
          history: {
            action: "item_assigned",
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
              wareModelId,
              wareModelName,
              quantity,
              unitPrice,
              assignedFromId: storeId,
            },
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  // 7. Resolve process
  const resolvedProcessId = await resolveProcessForPR({
    organizationId: orgId,
    requestingUnitId,
    wareModelId,
  });

  // 8. Link process to PR
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

  // 9. Create StepApprovals for first step
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

  // 10. Update PR status and push history
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
