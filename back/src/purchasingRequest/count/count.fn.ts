import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { purchasingRequest } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { status, processId, requesterId },
    get,
  } = body.details;

  const filters: Document = {};

  status && (filters["status"] = status);
  processId && (filters["process._id"] = new ObjectId(processId as string));
  requesterId && (filters["requester._id"] = new ObjectId(requesterId as string));

  const foundedItemsLength = await purchasingRequest.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
