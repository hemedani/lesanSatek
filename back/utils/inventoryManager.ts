import { type Document, ObjectId } from "lesan";
import { inventory, stockMovement } from "../mod.ts";

type StockOptions = {
  wareId?: string;
  wareName?: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  storeId?: string;
  inventoryId?: string; // If provided, look up inventory by _id instead of (unit, wareModel)
};

export async function addStock(
  unitId: string,
  wareModelId: string,
  quantity: number,
  reason: string,
  createdByUserId: string,
  options?: StockOptions,
): Promise<Document> {
  const existing = await inventory.findOne({
    filters: {
      "unit._id": new ObjectId(unitId),
      "wareModel._id": new ObjectId(wareModelId),
    },
    projection: { _id: 1, quantity: 1 },
  }) as Document;

  let balanceBefore = 0;

  if (existing) {
    balanceBefore = (existing.quantity as number) || 0;
    await inventory.findOneAndUpdate({
      filter: { _id: existing._id as ObjectId },
      update: {
        $inc: { quantity },
        $set: { updatedAt: new Date() },
      },
      projection: { _id: 1, quantity: 1 },
    });
  } else {
    const inventoryRelations: Record<string, unknown> = {
      unit: {
        _ids: new ObjectId(unitId),
        relatedRelations: { inventories: true },
      },
      wareModel: {
        _ids: new ObjectId(wareModelId),
        relatedRelations: { inventories: true },
      },
    };
    if (options?.wareId) {
      inventoryRelations.ware = {
        _ids: new ObjectId(options.wareId),
        relatedRelations: { inventories: true },
      };
    }
    await inventory.insertOne({
      doc: {
        quantity,
      },
      relations: inventoryRelations,
      projection: { _id: 1, quantity: 1 },
    });
  }

  const balanceAfter = balanceBefore + quantity;

  const stockMovementRelations: Record<string, unknown> = {
    unit: {
      _ids: new ObjectId(unitId),
      relatedRelations: { stockMovements: true },
    },
    createdBy: {
      _ids: new ObjectId(createdByUserId),
      relatedRelations: { createdStockMovements: true },
    },
    wareModel: {
      _ids: new ObjectId(wareModelId),
      relatedRelations: { stockMovements: true },
    },
  };

  if (options?.wareId) {
    stockMovementRelations.ware = {
      _ids: new ObjectId(options.wareId),
      relatedRelations: { stockMovements: true },
    };
  }

  if (options?.storeId) {
    stockMovementRelations.store = {
      _ids: new ObjectId(options.storeId),
      relatedRelations: { stockMovements: true },
    };
  }

  await stockMovement.insertOne({
    doc: {
      quantity,
      balanceBefore,
      balanceAfter,
      reason,
      ...(options?.referenceType && { referenceType: options.referenceType }),
      ...(options?.referenceId && { referenceId: options.referenceId }),
      ...(options?.description && { description: options.description }),
    },
    relations: stockMovementRelations,
    projection: { _id: 1, quantity: 1, balanceBefore: 1, balanceAfter: 1 },
  });

  return { success: true, wareModelId, balanceBefore, balanceAfter };
}

export async function removeStock(
  unitId: string,
  wareModelId: string,
  quantity: number,
  reason: string,
  createdByUserId: string,
  options?: StockOptions,
): Promise<Document> {
  let existing: Document;

  if (options?.inventoryId) {
    existing = await inventory.findOne({
      filters: { _id: new ObjectId(options.inventoryId) },
      projection: { _id: 1, quantity: 1 },
    }) as Document;
  } else {
    existing = await inventory.findOne({
      filters: {
        "unit._id": new ObjectId(unitId),
        "wareModel._id": new ObjectId(wareModelId),
      },
      projection: { _id: 1, quantity: 1 },
    }) as Document;
  }

  if (!existing) {
    throw new Error("Inventory not found for this unit and wareModel");
  }

  const balanceBefore = (existing.quantity as number) || 0;

  if (balanceBefore < quantity) {
    throw new Error("Insufficient inventory quantity");
  }

  const negQuantity = -Math.abs(quantity);

  await inventory.findOneAndUpdate({
    filter: { _id: existing._id as ObjectId },
    update: {
      $inc: { quantity: negQuantity },
      $set: { updatedAt: new Date() },
    },
    projection: { _id: 1, quantity: 1 },
  });

  const balanceAfter = balanceBefore - quantity;

  const stockMovementRelations: Record<string, unknown> = {
    unit: {
      _ids: new ObjectId(unitId),
      relatedRelations: { stockMovements: true },
    },
    createdBy: {
      _ids: new ObjectId(createdByUserId),
      relatedRelations: { createdStockMovements: true },
    },
    wareModel: {
      _ids: new ObjectId(wareModelId),
      relatedRelations: { stockMovements: true },
    },
  };

  if (options?.wareId) {
    stockMovementRelations.ware = {
      _ids: new ObjectId(options.wareId),
      relatedRelations: { stockMovements: true },
    };
  }

  if (options?.storeId) {
    stockMovementRelations.store = {
      _ids: new ObjectId(options.storeId),
      relatedRelations: { stockMovements: true },
    };
  }

  await stockMovement.insertOne({
    doc: {
      quantity: negQuantity,
      balanceBefore,
      balanceAfter,
      reason,
      ...(options?.referenceType && { referenceType: options.referenceType }),
      ...(options?.referenceId && { referenceId: options.referenceId }),
      ...(options?.description && { description: options.description }),
    },
    relations: stockMovementRelations,
    projection: { _id: 1, quantity: 1, balanceBefore: 1, balanceAfter: 1 },
  });

  return { success: true, wareModelId, balanceBefore, balanceAfter };
}

export async function transferStock(
  fromUnitId: string,
  toUnitId: string,
  wareModelId: string,
  quantity: number,
  createdByUserId: string,
  options?: StockOptions,
): Promise<Document> {
  await removeStock(fromUnitId, wareModelId, quantity, "transfer_out", createdByUserId, {
    ...options,
    referenceType: options?.referenceType || "unit",
    referenceId: options?.referenceId || toUnitId,
    description: options?.description || `Transfer to unit ${toUnitId}`,
  });

  await addStock(toUnitId, wareModelId, quantity, "transfer_in", createdByUserId, {
    ...options,
    referenceType: options?.referenceType || "unit",
    referenceId: options?.referenceId || fromUnitId,
    description: options?.description || `Transfer from unit ${fromUnitId}`,
  });

  return { success: true, wareModelId, quantity, fromUnitId, toUnitId };
}

export async function getStockLevel(
  unitId: string,
  wareModelId: string,
): Promise<Document> {
  const result = await inventory.findOne({
    filters: {
      "unit._id": new ObjectId(unitId),
      "wareModel._id": new ObjectId(wareModelId),
    },
    projection: {
      _id: 1,
      quantity: 1,
      minQuantity: 1,
      maxQuantity: 1,
      batchNo: 1,
      expirationDate: 1,
      location: 1,
      unit: 1,
      wareModel: 1,
    },
  });

  return (result as Document) || { quantity: 0 };
}

export async function getWarehouseDashboard(
  warehouseUnitId: string,
  wareModelId?: string,
): Promise<Document[]> {
  const match: Document = {
    $or: [
      { "unit._id": new ObjectId(warehouseUnitId) },
      { "warehouseUnit._id": new ObjectId(warehouseUnitId) },
    ],
  };
  if (wareModelId) {
    match["wareModel._id"] = new ObjectId(wareModelId);
  }

  const results = await inventory
    .aggregation({
      pipeline: [
        { $match: match },
        {
          $lookup: {
            from: "unit",
            localField: "unit",
            foreignField: "_id",
            as: "unitInfo",
          },
        },
        { $unwind: { path: "$unitInfo", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            wareModel: 1,
            quantity: 1,
            minQuantity: 1,
            maxQuantity: 1,
            location: 1,
            unitId: "$unitInfo._id",
            unitName: "$unitInfo.name",
            unitType: "$unitInfo.type",
          },
        },
        { $sort: { "wareModel.name": 1 } },
      ],
      projection: {
        _id: 1,
        quantity: 1,
        minQuantity: 1,
        maxQuantity: 1,
        location: 1,
        unitId: 1,
        unitName: 1,
        unitType: 1,
      },
    })
    .toArray();

  return results as Document[];
}
