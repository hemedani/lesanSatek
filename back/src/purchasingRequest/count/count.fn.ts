import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { status, processId, requesterId, storeId, wareId, wareTypeId, wareClassId, wareGroupId },
    get,
  } = body.details;

  const filters: Document = {};

  status && (filters["status"] = status);
  processId && (filters["process._id"] = new ObjectId(processId as string));
  requesterId && (filters["requester._id"] = new ObjectId(requesterId as string));
  storeId && (filters["store._id"] = new ObjectId(storeId as string));
  wareId && (filters["ware._id"] = new ObjectId(wareId as string));
  wareTypeId && (filters["wareType._id"] = new ObjectId(wareTypeId as string));
  wareClassId && (filters["wareClass._id"] = new ObjectId(wareClassId as string));
  wareGroupId && (filters["wareGroup._id"] = new ObjectId(wareGroupId as string));

  const foundedItemsLength = await purchasingRequest.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
