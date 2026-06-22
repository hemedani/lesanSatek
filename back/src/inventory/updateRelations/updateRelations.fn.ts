import { type ActFn, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";

export const updateRelationsFn: ActFn = async (body) => {
  const {
    set: { _id, unitId, warehouseUnitId },
    get,
  } = body.details;

  const inventoryId = new ObjectId(_id);

  if (unitId !== undefined) {
    await inventory.addRelation({
      filters: { _id: inventoryId },
      relations: {
        unit: {
          _ids: new ObjectId(unitId as string),
          relatedRelations: {
            inventories: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  if (warehouseUnitId !== undefined) {
    await inventory.addRelation({
      filters: { _id: inventoryId },
      relations: {
        warehouseUnit: {
          _ids: new ObjectId(warehouseUnitId as string),
          relatedRelations: {
            warehouseInventories: true,
          },
        },
      },
      projection: get,
      replace: true,
    });
  }

  return await inventory.findOne({
    filters: { _id: inventoryId },
    projection: get,
  });
};
