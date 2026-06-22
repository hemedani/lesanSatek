import type { ActFn, Document } from "lesan";
import { stockMovement } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { unitId, wareModelId, reason, referenceType, referenceId },
    get,
  } = body.details;

  const filters: Document = {};

  unitId && (filters["unit"] = unitId);
  wareModelId && (filters["wareModelId"] = wareModelId);
  reason && (filters["reason"] = reason);
  referenceType && (filters["referenceType"] = referenceType);
  referenceId && (filters["referenceId"] = referenceId);

  const foundedItemsLength = await stockMovement.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
