import { type ActFn, ObjectId } from "lesan";
import { purchasingRequest, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";
import { hasFeature } from "../../../utils/checkFeature.ts";

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, requestingUnitId, attachmentIds, tenderId, purchaseOrderItemIds, storeId, wareId, wareTypeId, wareClassId, wareGroupId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const requestId = new ObjectId(_id);
  const now = new Date();

  if (requestingUnitId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        requestingUnit: {
          _ids: new ObjectId(requestingUnitId as string),
          relatedRelations: {
            purchaseRequests: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (attachmentIds !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        attachments: {
          _ids: (attachmentIds as string[]).map((id: string) => new ObjectId(id)),
          relatedRelations: {},
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (tenderId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        tender: {
          _ids: new ObjectId(tenderId as string),
          relatedRelations: { purchasingRequest: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (purchaseOrderItemIds !== undefined) {
    if (!hasFeature(user, "canAssignItemsToOrder")) {
      throwError("You do not have permission to modify purchase items");
    }
    const activeRole = (user.roles || []).find((r: { roleId: string }) => r.roleId === body.details.set.activeRoleId);

    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        purchaseOrderItems: {
          _ids: (purchaseOrderItemIds as string[]).map((id: string) => new ObjectId(id)),
          relatedRelations: { purchasingRequest: true },
        },
      },
      projection: get,
      replace: true,
    });

    await purchasingRequest.findOneAndUpdate({
      filter: { _id: requestId },
      update: {
        $push: {
          history: {
            action: "item_assigned",
            performed: {
              by: user._id.toString(),
              name: `${user.first_name} ${user.last_name}`,
              at: now,
              role: activeRole
                ? { id: activeRole.roleId, name: activeRole.name, scopeType: activeRole.scopeType, scopeId: activeRole.scopeId }
                : { id: "", name: "" },
            },
            details: { purchaseOrderItemIds, note: "Purchase items updated via relations" },
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  if (storeId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        store: {
          _ids: new ObjectId(storeId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (wareId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        ware: {
          _ids: new ObjectId(wareId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (wareTypeId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        wareType: {
          _ids: new ObjectId(wareTypeId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (wareClassId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        wareClass: {
          _ids: new ObjectId(wareClassId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (wareGroupId !== undefined) {
    await purchasingRequest.addRelation({
      filters: { _id: requestId },
      relations: {
        wareGroup: {
          _ids: new ObjectId(wareGroupId as string),
          relatedRelations: { purchasingRequests: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  return await purchasingRequest.findOne({
    filters: { _id: requestId },
    projection: get,
  });
};
