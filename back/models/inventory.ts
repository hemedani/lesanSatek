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
