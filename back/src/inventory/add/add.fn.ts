import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, unitId, warehouseUnitId, wareModelId, wareId, ...rest } = set;

  const existing = await inventory.findOne({
    filters: {
      "unit._id": new ObjectId(unitId as string),
      "wareModel._id": new ObjectId(wareModelId as string),
    },
    projection: { _id: 1, quantity: 1 },
  }) as Document;

  if (existing) {
    const updateFields: Record<string, unknown> = {};
    if (rest.quantity !== undefined) updateFields.quantity = rest.quantity;
    if (rest.minQuantity !== undefined) updateFields.minQuantity = rest.minQuantity;
    if (rest.maxQuantity !== undefined) updateFields.maxQuantity = rest.maxQuantity;
    if (rest.location !== undefined) updateFields.location = rest.location;
    if (rest.batchNo !== undefined) updateFields.batchNo = rest.batchNo;
    if (rest.expirationDate !== undefined) updateFields.expirationDate = rest.expirationDate;
    updateFields.updatedAt = new Date();

    return await inventory.findOneAndUpdate({
      filter: { _id: existing._id as ObjectId },
      update: { $set: updateFields },
      projection: get,
    });
  }

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
