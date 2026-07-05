import { type ActFn, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, unitId, warehouseUnitId, wareModelId, wareId, ...rest } = set;

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

  relations.wareModel = {
    _ids: new ObjectId(wareModelId as string),
    relatedRelations: {
      inventories: true,
    },
  };

  if (wareId) {
    relations.ware = {
      _ids: new ObjectId(wareId as string),
      relatedRelations: {
        inventories: true,
      },
    };
  }

  return await inventory.insertOne({
    doc: rest,
    relations,
    projection: get,
  });
};
