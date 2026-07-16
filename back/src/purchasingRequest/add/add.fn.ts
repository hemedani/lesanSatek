import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, wareModel, unit, user as userModel, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";
import { resolveProcessForPR } from "../../../utils/resolveProcess.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const {
    activeRoleId,
    wareModelId,
    requestingUnitId,
    attachmentIds,
    storeId,
    wareId,
    wareTypeId,
    wareClassId,
    wareGroupId,
    ...rest
  } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === activeRoleId);

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
    const userDoc = await userModel.findOne({
      filters: { _id: user._id },
      projection: { organization: { _id: 1 } },
    }) as Record<string, unknown> | undefined;
    if (userDoc?.organization) {
      const org = userDoc.organization as Record<string, unknown>;
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

  if (attachmentIds && attachmentIds.length > 0) {
    relations.attachments = {
      _ids: (attachmentIds as string[]).map((id: string) => new ObjectId(id)),
      relatedRelations: {},
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

    // Add explicitly provided IDs (may override auto-resolve)
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

  const result = await purchasingRequest.insertOne({
    doc: {
      ...rest,
      history: [{
        action: "created",
        performed: {
          by: user._id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          at: new Date(),
          role: activeRole ? {
            id: activeRole.roleId,
            name: activeRole.name,
            scopeType: activeRole.scopeType,
            scopeId: activeRole.scopeId,
          } : { id: "", name: "" },
        },
        details: {},
      }],
    },
    relations,
    projection: get,
  });

  return result;
};
