import type { ActFn, Document } from "lesan";
import { tender } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { title, status, purchasingRequestId },
    get,
  } = body.details;

  const filters: Document = {};

  title && (filters["title"] = { $regex: title, $options: "i" });
  status && (filters["status"] = status);
  purchasingRequestId && (filters["purchasingRequest"] = purchasingRequestId);

  const foundedItemsLength = await tender.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
