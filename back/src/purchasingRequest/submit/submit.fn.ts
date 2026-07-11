import { type ActFn, ObjectId } from "lesan";
import {
  purchasingRequest,
  processStep,
  stepApproval,
  budgetEncumbrance,
  budgetLine,
  wareModel,
  unit,
  inventory,
  coreApp,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";
import { resolveProcessForPR } from "../../../utils/resolveProcess.ts";

export const submitFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const { activeRoleId, requestingUnitId, attachmentIds, budgetLineId, wareModelId, storeId, wareId, wareTypeId, wareClassId, wareGroupId, ...rest } =
    set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

  const now = new Date();

  let organizationId: string | undefined;
  const userAny = user as Record<string, unknown>;
  const userOrg = userAny.organization as Record<string, unknown> | undefined;
  if (userOrg?._id) {
    organizationId = (userOrg._id as ObjectId).toString();
  }
  if (!organizationId && requestingUnitId) {
    const unitDoc = await unit.findOne({
      filters: { _id: new ObjectId(requestingUnitId as string) },
      projection: { organization: { _id: 1 } },
    }) as Record<string, unknown> | undefined;
    if (unitDoc?.organization) {
      const org = unitDoc.organization as Record<string, unknown>;
      if (org._id) {
        organizationId = org._id.toString();
      }
    }
  }
  if (!organizationId) {
    throwError("Could not determine organization. Please ensure you belong to an organization.");
    return;
  }

  const resolvedProcessId = await resolveProcessForPR({
    organizationId,
    requestingUnitId: requestingUnitId as string | undefined,
    wareModelId: wareModelId as string,
    wareId: wareId as string | undefined,
    wareTypeId: wareTypeId as string | undefined,
    wareClassId: wareClassId as string | undefined,
    wareGroupId: wareGroupId as string | undefined,
  });

  const relations: Record<string, unknown> = {
    process: {
      _ids: new ObjectId(resolvedProcessId),
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

  // Auto-resolve wareType, wareClass, wareGroup from wareModel if not explicitly provided
  if (wareModelId) {
    const resolvedWareTypeId = wareTypeId || null;
    const resolvedWareClassId = wareClassId || null;
    const resolvedWareGroupId = wareGroupId || null;

    if (!resolvedWareTypeId || !resolvedWareClassId || !resolvedWareGroupId) {
      const wm = await wareModel.findOne({
        filters: { _id: new ObjectId(wareModelId as string) },
        projection: { wareType: { _id: 1 }, wareClass: { _id: 1 }, wareGroup: { _id: 1 } },
      }) as Record<string, unknown> | undefined;

      if (wm) {
        if (!resolvedWareTypeId) {
          const wt = wm.wareType as Record<string, unknown> | undefined;
          if (wt?._id) {
            relations.wareType = {
              _ids: new ObjectId(wt._id as string),
              relatedRelations: { purchasingRequests: true },
            };
          }
        }
        if (!resolvedWareClassId) {
          const wc = wm.wareClass as Record<string, unknown> | undefined;
          if (wc?._id) {
            relations.wareClass = {
              _ids: new ObjectId(wc._id as string),
              relatedRelations: { purchasingRequests: true },
            };
          }
        }
        if (!resolvedWareGroupId) {
          const wg = wm.wareGroup as Record<string, unknown> | undefined;
          if (wg?._id) {
            relations.wareGroup = {
              _ids: new ObjectId(wg._id as string),
              relatedRelations: { purchasingRequests: true },
            };
          }
        }
      }
    }

    if (wareTypeId) {
      relations.wareType = {
        _ids: new ObjectId(wareTypeId as string),
        relatedRelations: { purchasingRequests: true },
      };
    }
    if (wareClassId) {
      relations.wareClass = {
        _ids: new ObjectId(wareClassId as string),
        relatedRelations: { purchasingRequests: true },
      };
    }
    if (wareGroupId) {
      relations.wareGroup = {
        _ids: new ObjectId(wareGroupId as string),
        relatedRelations: { purchasingRequests: true },
      };
    }
  }

  if (storeId) {
    relations.store = {
      _ids: new ObjectId(storeId as string),
      relatedRelations: { purchasingRequests: true },
    };
  }

  if (wareId) {
    relations.ware = {
      _ids: new ObjectId(wareId as string),
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
      { $match: { "process._id": new ObjectId(resolvedProcessId) } },
      { $sort: { order: 1 } },
      { $limit: 1 },
    ],
    projection: { _id: 1, assigneeGroups: 1 },
  }).toArray();

  if (!createdRequest) {
    throwError("Failed to create purchasing request");
    return;
  }

  // Get requesting unit's current inventory for this ware model
  let unitInventory: Record<string, unknown> | null = null;
  if (requestingUnitId && wareModelId) {
    unitInventory = await inventory.findOne({
      filters: {
        unit: new ObjectId(requestingUnitId as string),
        "wareModel._id": new ObjectId(wareModelId as string),
      },
      projection: {
        quantity: 1,
        minQuantity: 1,
        maxQuantity: 1,
        wareModel: { _id: 1, name: 1 },
      },
    }) as Record<string, unknown> | null;
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
          details: {
            status: "Pending",
            currentStep: 0,
            ...(unitInventory && {
              requestingUnitInventory: {
                quantity: unitInventory.quantity,
                minQuantity: unitInventory.minQuantity,
                maxQuantity: unitInventory.maxQuantity,
                wareModelId,
                wareModelName: (unitInventory.wareModel as Record<string, unknown>)?.name,
              },
            }),
          },
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
