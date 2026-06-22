import { type Document, ObjectId } from "lesan";
import { inventory, stockMovement } from "../mod.ts";

type StockOptions = {
  wareId?: string;
  wareName?: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
};

export async function addStock(
  unitId: string,
  wareModelId: string,
  wareModelName: string,
  quantity: number,
  reason: string,
  createdByUserId: string,
  options?: StockOptions,
): Promise<Document> {
  const existing = await inventory.findOne({
    filters: {
      unit: new ObjectId(unitId),
      wareModelId,
    },
    projection: { _id: 1, quantity: 1, wareModelId: 1 },
  }) as Document;

  let balanceBefore = 0;

  if (existing) {
    balanceBefore = (existing.quantity as number) || 0;
    await inventory.findOneAndUpdate({
      filter: { _id: existing._id as ObjectId },
      update: {
        $inc: { quantity },
        $set: { updatedAt: new Date() },
        $setOnInsert: {
          wareModelName,
          unit: new ObjectId(unitId),
        },
      },
      projection: { _id: 1, quantity: 1 },
    });
  } else {
    await inventory.insertOne({
      doc: {
        wareModelId,
        wareModelName,
        quantity,
        ...(options?.wareId && { wareId: options.wareId }),
        ...(options?.wareName && { wareName: options.wareName }),
      },
      relations: {
        unit: {
          _ids: new ObjectId(unitId),
          relatedRelations: { inventories: true },
        },
      },
      projection: { _id: 1, quantity: 1 },
    });
  }

  const balanceAfter = balanceBefore + quantity;

  await stockMovement.insertOne({
    doc: {
      wareModelId,
      wareModelName,
      ...(options?.wareId && { wareId: options.wareId }),
      ...(options?.wareName && { wareName: options.wareName }),
      quantity,
      balanceBefore,
      balanceAfter,
      reason,
      ...(options?.referenceType && { referenceType: options.referenceType }),
      ...(options?.referenceId && { referenceId: options.referenceId }),
      ...(options?.description && { description: options.description }),
    },
    relations: {
      unit: {
        _ids: new ObjectId(unitId),
        relatedRelations: { stockMovements: true },
      },
      createdBy: {
        _ids: new ObjectId(createdByUserId),
        relatedRelations: { createdStockMovements: true },
      },
    },
    projection: { _id: 1, quantity: 1, balanceBefore: 1, balanceAfter: 1 },
  });

  return { success: true, wareModelId, balanceBefore, balanceAfter };
}

export async function removeStock(
  unitId: string,
  wareModelId: string,
  wareModelName: string,
  quantity: number,
  reason: string,
  createdByUserId: string,
  options?: StockOptions,
): Promise<Document> {
  const existing = await inventory.findOne({
    filters: {
      unit: new ObjectId(unitId),
      wareModelId,
    },
    projection: { _id: 1, quantity: 1 },
  }) as Document;

  if (!existing) {
    throw { error: "Inventory not found for this unit and wareModel" };
  }

  const balanceBefore = (existing.quantity as number) || 0;

  if (balanceBefore < quantity) {
    throw { error: "Insufficient inventory quantity" };
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

  await stockMovement.insertOne({
    doc: {
      wareModelId,
      wareModelName,
      ...(options?.wareId && { wareId: options.wareId }),
      ...(options?.wareName && { wareName: options.wareName }),
      quantity: negQuantity,
      balanceBefore,
      balanceAfter,
      reason,
      ...(options?.referenceType && { referenceType: options.referenceType }),
      ...(options?.referenceId && { referenceId: options.referenceId }),
      ...(options?.description && { description: options.description }),
    },
    relations: {
      unit: {
        _ids: new ObjectId(unitId),
        relatedRelations: { stockMovements: true },
      },
      createdBy: {
        _ids: new ObjectId(createdByUserId),
        relatedRelations: { createdStockMovements: true },
      },
    },
    projection: { _id: 1, quantity: 1, balanceBefore: 1, balanceAfter: 1 },
  });

  return { success: true, wareModelId, balanceBefore, balanceAfter };
}

export async function transferStock(
  fromUnitId: string,
  toUnitId: string,
  wareModelId: string,
  wareModelName: string,
  quantity: number,
  createdByUserId: string,
  options?: StockOptions,
): Promise<Document> {
  await removeStock(fromUnitId, wareModelId, wareModelName, quantity, "transfer_out", createdByUserId, {
    ...options,
    referenceType: options?.referenceType || "unit",
    referenceId: options?.referenceId || toUnitId,
    description: options?.description || `Transfer to unit ${toUnitId}`,
  });

  await addStock(toUnitId, wareModelId, wareModelName, quantity, "transfer_in", createdByUserId, {
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
      unit: new ObjectId(unitId),
      wareModelId,
    },
    projection: {
      _id: 1,
      wareModelId: 1,
      wareModelName: 1,
      quantity: 1,
      minQuantity: 1,
      maxQuantity: 1,
      batchNo: 1,
      expirationDate: 1,
      location: 1,
      unit: 1,
    },
  });

  return (result as Document) || { quantity: 0, wareModelId };
}

export async function getWarehouseDashboard(
  warehouseUnitId: string,
  wareModelId?: string,
): Promise<Document[]> {
  const match: Document = {
    $or: [
      { unit: new ObjectId(warehouseUnitId) },
      { warehouseUnit: new ObjectId(warehouseUnitId) },
    ],
  };

  if (wareModelId) {
    match.wareModelId = wareModelId;
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
            wareModelId: 1,
            wareModelName: 1,
            quantity: 1,
            minQuantity: 1,
            maxQuantity: 1,
            location: 1,
            unitId: "$unitInfo._id",
            unitName: "$unitInfo.name",
            unitType: "$unitInfo.type",
          },
        },
        { $sort: { wareModelName: 1 } },
      ],
      projection: {
        _id: 1,
        wareModelId: 1,
        wareModelName: 1,
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
