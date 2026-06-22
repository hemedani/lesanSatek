import { coreApp } from "../mod.ts";
import {
  coerce,
  date,
  defaulted,
  enums,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { unit_excludes, user_excludes } from "./excludes.ts";

export const stockMovement_reason_array = [
  "goods_receipt",
  "goods_issue",
  "transfer_in",
  "transfer_out",
  "consumption",
  "adjustment",
  "return",
  "write_off",
];
export const stockMovement_reason_emums = enums(stockMovement_reason_array);

export const stockMovement_pure = {
  wareModelId: string(),
  wareModelName: string(),
  wareId: optional(string()),
  wareName: optional(string()),
  quantity: number(),
  balanceBefore: number(),
  balanceAfter: number(),
  reason: defaulted(
    coerce(
      stockMovement_reason_emums,
      string(),
      (value) => value as typeof stockMovement_reason_array[number],
    ),
    "adjustment",
  ),
  referenceType: optional(string()),
  referenceId: optional(string()),
  description: optional(string()),
  ...createUpdateAt,
};

export const stockMovement_relations = {
  unit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: false,
    excludes: unit_excludes,
    relatedRelations: {
      stockMovements: {
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
      createdStockMovements: {
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

export const stockMovements = () =>
  coreApp.odm.newModel("stockMovement", stockMovement_pure, stockMovement_relations);
