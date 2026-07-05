import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { wareModelId, unitId, warehouseUnitId },
    get,
  } = body.details;

  const filters: Document = {};

  wareModelId && (filters["wareModel._id"] = new ObjectId(wareModelId));
  unitId && (filters["unit"] = unitId);
  warehouseUnitId && (filters["warehouseUnit"] = warehouseUnitId);

  const foundedItemsLength = await inventory.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
