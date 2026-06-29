import { type ActFn, ObjectId } from "lesan";
import { purchaseOrderItem } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, purchasingRequestId, assignedFromId, assignedById },
    get,
  } = body.details;

  const itemId = new ObjectId(_id);

  if (purchasingRequestId !== undefined) {
    await purchaseOrderItem.addRelation({
      filters: { _id: itemId },
      relations: {
        purchasingRequest: {
          _ids: new ObjectId(purchasingRequestId as string),
          relatedRelations: {
            purchaseOrderItems: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (assignedFromId !== undefined) {
    await purchaseOrderItem.addRelation({
      filters: { _id: itemId },
      relations: {
        assignedFrom: {
          _ids: new ObjectId(assignedFromId as string),
          relatedRelations: { purchaseOrderItems: true },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (assignedById !== undefined) {
    await purchaseOrderItem.addRelation({
      filters: { _id: itemId },
      relations: {
        assignedBy: {
          _ids: new ObjectId(assignedById as string),
          relatedRelations: {},
        },
      },
      projection: get,
      replace: true,
    });
  }

  return await purchaseOrderItem.findOne({
    filters: { _id: itemId },
    projection: get,
  });
};
