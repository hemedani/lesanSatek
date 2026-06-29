/**
 * Inventory — Per-unit stock tracking.
 *
 * Tracks the quantity of a specific WareModel (optionally a specific Ware) within
 * a Unit. Has a unique compound index on (unit, wareModelId) ensuring one record
 * per unit+model combo. Supports min/max quantity alerts, batch tracking,
 * expiration dates, and location. Records are created/updated by the
 * inventoryManager utility (addStock, removeStock, adjustStock, transferStock).
 *
 * Pure fields: wareModelId, wareModelName, wareId, wareName, quantity,
 *   minQuantity, maxQuantity, batchNo, expirationDate, location, lastCountedAt
 * Relations: unit (Unit — inventory owner), warehouseUnit (Unit — org warehouse, optional)
 *
 * @example
 * // Inventory record for TSH Kit in the central warehouse, received via goods receipt gr_tsh
 * // Also shows the Lab's separate inventory record consuming from this stock
 * {
 *   _id: ObjectId("inv_tsh_warehouse"),
 *   wareModelId: "wm_tsh",
 *   wareModelName: "کیت TSH پیشرفته",
 *   wareId: "w_tsh_zist",
 *   wareName: "کیت TSH پیشرفته ZistShimi",
 *   quantity: 50,
 *   minQuantity: 10,
 *   maxQuantity: 200,
 *   batchNo: "BATCH-2024-001",
 *   expirationDate: ISODate("2025-06-01"),
 *   location: "قفسه A، ردیف ۳",
 *   lastCountedAt: ISODate("2024-06-01T10:00:00Z"),
 *   // Relations (populated via Lesan):
 *   // unit → { _id: ObjectId("unit_warehouse"), name: "انبار مرکزی" }
 *   // warehouseUnit → { _id: ObjectId("unit_warehouse") }
 *   createdAt: ISODate("2024-01-15T08:00:00Z"),
 *   updatedAt: ISODate("2024-06-10T14:00:00Z")
 * }
 * // ── Lab's separate inventory (transferred from warehouse) ──
 * // {
 * //   _id: ObjectId("inv_tsh_lab"),
 * //   wareModelId: "wm_tsh",
 * //   quantity: 50,
 * //   unit: { _id: ObjectId("unit_lab") },
 * //   warehouseUnit: { _id: ObjectId("unit_warehouse") }
 * // }
 */
import { coreApp } from "../mod.ts";
import {
  coerce,
  date,
  defaulted,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { unit_excludes } from "./excludes.ts";

export const inventory_pure = {
  wareModelId: string(),
  wareModelName: string(),
  wareId: optional(string()),
  wareName: optional(string()),
  quantity: defaulted(number(), 0),
  minQuantity: optional(number()),
  maxQuantity: optional(number()),
  batchNo: optional(string()),
  expirationDate: optional(coerce(date(), string(), (value) => new Date(value))),
  location: optional(string()),
  lastCountedAt: optional(coerce(date(), string(), (value) => new Date(value))),
  ...createUpdateAt,
};

export const inventory_relations = {
  unit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: false,
    excludes: unit_excludes,
    relatedRelations: {
      inventories: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  warehouseUnit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: true,
    excludes: unit_excludes,
    relatedRelations: {
      warehouseInventories: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
};

export const inventories = () =>
  coreApp.odm.newModel("inventory", inventory_pure, inventory_relations);

export const createInventoryIndex = async () => {
  const collection = coreApp.odm.getCollection("inventory");
  try {
    await collection.createIndex(
      { unit: 1, wareModelId: 1 },
      { unique: true },
    );
  } catch (error) {
    console.log(
      "Inventory compound index already exists or creation failed:",
      (error as Error).message,
    );
  }
};
