import { coreApp } from "../mod.ts";
import {
  enums,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { budgetLine_excludes, user_excludes } from "./excludes.ts";

export const budgetEncumbrance_pure = {
  amount: number(),
  status: enums(["reserved", "spent", "released"]),
  referenceType: string(),
  referenceId: string(),
  description: optional(string()),
  ...createUpdateAt,
};

export const budgetEncumbrance_relations = {
  budgetLine: {
    schemaName: "budgetLine",
    type: "single" as RelationDataType,
    optional: false,
    excludes: budgetLine_excludes,
    relatedRelations: {
      encumbrances: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  createdBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      budgetEncumbrances: {
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

export const budgetEncumbrances = () =>
  coreApp.odm.newModel("budgetEncumbrance", budgetEncumbrance_pure, budgetEncumbrance_relations);
