import type { ActFn, Document } from "lesan";
import { purchaseOrderItem } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { purchasingRequestId, status, wareModelId },
    get,
  } = body.details;

  const filters: Document = {};

  purchasingRequestId &&
    (filters["purchasingRequest"] = purchasingRequestId);
  status && (filters["status"] = status);
  wareModelId && (filters["wareModel._id"] = wareModelId);

  const foundedItemsLength = await purchaseOrderItem.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
