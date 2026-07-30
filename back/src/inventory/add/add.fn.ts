import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory, ware, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "../../../utils/throwError.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const { activeRoleId, unitId, warehouseUnitId, wareId, ...rest } = set;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  if (!user.isGhost && activeRole && !["Manager", "Admin"].includes(activeRole.name)) {
    if (activeRole.scopeType === "unit" && activeRole.scopeId) {
      if (activeRole.scopeId.toString() !== unitId.toString()) {
        throwError("You can only add inventory to your own unit");
        return;
      }
    } else {
      throwError("Your active role does not have an associated unit");
      return;
    }
  }

  const wareDoc = await ware.findOne({
    filters: { _id: new ObjectId(wareId as string) },
    projection: {
      _id: 1,
      "wareModel._id": 1,
      "wareGroup._id": 1,
      "wareClass._id": 1,
      "wareType._id": 1,
    },
  }) as Document;

  if (!wareDoc) {
    throwError("Ware not found");
    return;
  }

  const existing = await inventory.findOne({
    filters: {
      "unit._id": new ObjectId(unitId as string),
      "ware._id": new ObjectId(wareId as string),
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

  const inventoryRelations: Record<string, unknown> = {};

  inventoryRelations.unit = {
    _ids: new ObjectId(unitId as string),
    relatedRelations: { inventories: true },
  };

  if (warehouseUnitId) {
    inventoryRelations.warehouseUnit = {
      _ids: new ObjectId(warehouseUnitId as string),
      relatedRelations: { warehouseInventories: true },
    };
  }

  inventoryRelations.ware = {
    _ids: new ObjectId(wareId as string),
    relatedRelations: { inventories: true },
  };

  inventoryRelations.wareModel = {
    _ids: (wareDoc.wareModel as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { inventories: true },
  };

  inventoryRelations.wareGroup = {
    _ids: (wareDoc.wareGroup as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { inventories: true },
  };

  inventoryRelations.wareClass = {
    _ids: (wareDoc.wareClass as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { inventories: true },
  };

  inventoryRelations.wareType = {
    _ids: (wareDoc.wareType as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { inventories: true },
  };

  return await inventory.insertOne({
    doc: rest,
    relations: inventoryRelations,
    projection: get,
  });
};
