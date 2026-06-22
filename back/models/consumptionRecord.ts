import { coreApp } from "../mod.ts";
import {
  coerce,
  date,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { inventory_excludes, unit_excludes, user_excludes } from "./excludes.ts";

export const consumptionRecord_pure = {
  wareModelId: string(),
  wareModelName: string(),
  wareId: optional(string()),
  wareName: optional(string()),
  quantity: number(),
  consumedAt: coerce(date(), string(), (value) => new Date(value)),
  reason: optional(string()),
  patientId: optional(string()),
  notes: optional(string()),
  ...createUpdateAt,
};

export const consumptionRecord_relations = {
  unit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: false,
    excludes: unit_excludes,
    relatedRelations: {
      consumptionRecords: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  consumedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      consumptionRecords: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  inventory: {
    schemaName: "inventory",
    type: "single" as RelationDataType,
    optional: true,
    excludes: inventory_excludes,
    relatedRelations: {
      consumptionRecords: {
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

export const consumptionRecords = () =>
  coreApp.odm.newModel("consumptionRecord", consumptionRecord_pure, consumptionRecord_relations);
