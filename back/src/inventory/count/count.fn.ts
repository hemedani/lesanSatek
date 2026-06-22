import type { ActFn, Document } from "lesan";
import { inventory } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { wareModelId, unitId, warehouseUnitId },
    get,
  } = body.details;

  const filters: Document = {};

  wareModelId && (filters["wareModelId"] = wareModelId);
  unitId && (filters["unit"] = unitId);
  warehouseUnitId && (filters["warehouseUnit"] = warehouseUnitId);

  const foundedItemsLength = await inventory.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
