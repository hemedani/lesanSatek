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
import { budgetLine_excludes, user_excludes } from "./excludes.ts";

export const budgetAllocation_pure = {
  amount: number(),
  description: optional(string()),
  allocatedAt: coerce(date(), string(), (value) => new Date(value)),
  ...createUpdateAt,
};

export const budgetAllocation_relations = {
  budgetLine: {
    schemaName: "budgetLine",
    type: "single" as RelationDataType,
    optional: false,
    excludes: budgetLine_excludes,
    relatedRelations: {
      allocations: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  allocatedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      budgetAllocations: {
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

export const budgetAllocations = () =>
  coreApp.odm.newModel("budgetAllocation", budgetAllocation_pure, budgetAllocation_relations);
