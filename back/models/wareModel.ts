/**
 * WareModel — Fourth-level specific product model.
 *
 * Level 4 of the warehouse hierarchy. The most specific classification level,
 * representing a named model (e.g. "TSH Kit"). Belongs to exactly one WareType,
 * one WareClass, and one WareGroup. This is the key level used in
 * PurchasingRequest items and Inventory tracking (wareModelId/wareModelName).
 *
 * Pure fields: name, enName
 * Relations: creator (User), wareType (WareType), wareClass (WareClass), wareGroup (WareGroup) —
 *   Lesan auto-creates reverse relations on all three parent models,
 *   plus wares and stuffs from child models.
 *
 * @example
 * // A specific lab kit model
 * {
 *   _id: ObjectId("..."),
 *   name: "کیت TSH پیشرفته",
 *   enName: "Advanced TSH Kit",
 *   createdAt: ISODate("2024-01-01T00:00:00Z"),
 *   updatedAt: ISODate("2024-01-01T00:00:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import { optional, type RelationDataType, type RelationSortOrderType, string } from "lesan";
import { createUpdateAt } from "@lib";
import {
  user_excludes,
  wareType_excludes,
  wareClass_excludes,
  wareGroup_excludes,
} from "./excludes.ts";

export const wareModel_pure = {
  name: string(),
  enName: optional(string()),
  ...createUpdateAt,
};

export const wareModel_relations = {
  creator: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {},
  },
  wareType: {
    schemaName: "wareType",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareType_excludes,
    relatedRelations: {
      wareModels: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  wareClass: {
    schemaName: "wareClass",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareClass_excludes,
    relatedRelations: {
      wareModels: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  wareGroup: {
    schemaName: "wareGroup",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareGroup_excludes,
    relatedRelations: {
      wareModels: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const wareModels = () =>
  coreApp.odm.newModel("wareModel", wareModel_pure, wareModel_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        enName: "text",
      },
    },
  });
