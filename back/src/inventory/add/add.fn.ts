import { type ActFn, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, unitId, warehouseUnitId, ...rest } = set;

  const relations: Record<string, unknown> = {};

  relations.unit = {
    _ids: new ObjectId(unitId as string),
    relatedRelations: {
      inventories: true,
    },
  };

  if (warehouseUnitId) {
    relations.warehouseUnit = {
      _ids: new ObjectId(warehouseUnitId as string),
      relatedRelations: {
        warehouseInventories: true,
      },
    };
  }

  return await inventory.insertOne({
    doc: rest,
    relations,
    projection: get,
  });
};
