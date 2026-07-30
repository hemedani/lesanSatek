import { type Document, ObjectId } from "lesan";
import { inventory, stockMovement, ware } from "../mod.ts";

type StockOptions = {
  wareName?: string;
  wareModelId?: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  storeId?: string;
  inventoryId?: string;
};

async function getWareHierarchy(wareId: string): Promise<{
  wareModelId: ObjectId;
  wareGroupId: ObjectId;
  wareClassId: ObjectId;
  wareTypeId: ObjectId;
}> {
  const wareDoc = await ware.findOne({
    filters: { _id: new ObjectId(wareId) },
    projection: {
      _id: 1,
      "wareModel._id": 1,
      "wareGroup._id": 1,
      "wareClass._id": 1,
      "wareType._id": 1,
    },
  }) as Document | null;

  if (!wareDoc) {
    throw new Error(`Ware not found: ${wareId}`);
  }

  return {
    wareModelId: (wareDoc.wareModel as Record<string, unknown>)?._id as ObjectId,
    wareGroupId: (wareDoc.wareGroup as Record<string, unknown>)?._id as ObjectId,
    wareClassId: (wareDoc.wareClass as Record<string, unknown>)?._id as ObjectId,
    wareTypeId: (wareDoc.wareType as Record<string, unknown>)?._id as ObjectId,
  };
}

function buildHierarchyRelations(
  wareId: ObjectId,
  hierarchy: { wareModelId: ObjectId; wareGroupId: ObjectId; wareClassId: ObjectId; wareTypeId: ObjectId },
): Record<string, unknown> {
  return {
    ware: {
      _ids: wareId,
      relatedRelations: { inventories: true },
    },
    wareModel: {
      _ids: hierarchy.wareModelId,
      relatedRelations: { inventories: true },
    },
    wareGroup: {
      _ids: hierarchy.wareGroupId,
      relatedRelations: { inventories: true },
    },
    wareClass: {
      _ids: hierarchy.wareClassId,
      relatedRelations: { inventories: true },
    },
    wareType: {
      _ids: hierarchy.wareTypeId,
      relatedRelations: { inventories: true },
    },
  };
}

function buildStockMovementHierarchyRelations(
  wareId: ObjectId | undefined,
  hierarchy?: { wareModelId: ObjectId; wareGroupId: ObjectId; wareClassId: ObjectId; wareTypeId: ObjectId },
): Record<string, unknown> {
  const rels: Record<string, unknown> = {};
  if (wareId) {
    rels.ware = {
      _ids: wareId,
      relatedRelations: { stockMovements: true },
    };
  }
  if (hierarchy) {
    rels.wareModel = {
      _ids: hierarchy.wareModelId,
      relatedRelations: { stockMovements: true },
    };
    rels.wareGroup = {
      _ids: hierarchy.wareGroupId,
      relatedRelations: { stockMovements: true },
    };
    rels.wareClass = {
      _ids: hierarchy.wareClassId,
      relatedRelations: { stockMovements: true },
    };
    rels.wareType = {
      _ids: hierarchy.wareTypeId,
      relatedRelations: { stockMovements: true },
    };
  }
  return rels;
}

export async function addStock(
  unitId: string,
  wareId: string,
  quantity: number,
  reason: string,
  createdByUserId: string,
  options?: StockOptions,
): Promise<Document> {
  const hierarchy = await getWareHierarchy(wareId);

  const existing = await inventory.findOne({
    filters: {
      "unit._id": new ObjectId(unitId),
      "ware._id": new ObjectId(wareId),
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
      ...buildHierarchyRelations(new ObjectId(wareId), hierarchy),
    };

    if (options?.storeId) {
      inventoryRelations.store = {
        _ids: new ObjectId(options.storeId),
        relatedRelations: { inventories: true },
      };
    }

    await inventory.insertOne({
      doc: { quantity },
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
    ...buildStockMovementHierarchyRelations(new ObjectId(wareId), hierarchy),
  };

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

  return { success: true, wareId, balanceBefore, balanceAfter };
}

export async function removeStock(
  unitId: string,
  wareId: string,
  quantity: number,
  reason: string,
  createdByUserId: string,
  options?: StockOptions,
): Promise<Document> {
  const hierarchy = await getWareHierarchy(wareId);

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
        "ware._id": new ObjectId(wareId),
      },
      projection: { _id: 1, quantity: 1 },
    }) as Document;
  }

  if (!existing) {
    throw new Error("Inventory not found for this unit and ware");
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
    ...buildStockMovementHierarchyRelations(new ObjectId(wareId), hierarchy),
  };

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

  return { success: true, wareId, balanceBefore, balanceAfter };
}

export async function transferStock(
  fromUnitId: string,
  toUnitId: string,
  wareId: string,
  quantity: number,
  createdByUserId: string,
  options?: StockOptions,
): Promise<Document> {
  await removeStock(fromUnitId, wareId, quantity, "transfer_out", createdByUserId, {
    ...options,
    referenceType: options?.referenceType || "unit",
    referenceId: options?.referenceId || toUnitId,
    description: options?.description || `Transfer to unit ${toUnitId}`,
  });

  await addStock(toUnitId, wareId, quantity, "transfer_in", createdByUserId, {
    ...options,
    referenceType: options?.referenceType || "unit",
    referenceId: options?.referenceId || fromUnitId,
    description: options?.description || `Transfer from unit ${fromUnitId}`,
  });

  return { success: true, wareId, quantity, fromUnitId, toUnitId };
}

export async function getStockLevel(
  unitId: string,
  wareId: string,
): Promise<Document> {
  const result = await inventory.findOne({
    filters: {
      "unit._id": new ObjectId(unitId),
      "ware._id": new ObjectId(wareId),
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
      ware: 1,
    },
  });

  return (result as Document) || { quantity: 0 };
}

export async function getWarehouseDashboard(
  warehouseUnitId: string,
  wareModelId?: string,
  wareId?: string,
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
  if (wareId) {
    match["ware._id"] = new ObjectId(wareId);
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
            ware: 1,
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
        { $sort: { "ware.name": 1 } },
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
