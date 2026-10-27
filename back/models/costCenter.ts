/**
 * CostCenter — Cost or profit center mapped to an organizational Unit.
 *
 * Used as the analytical dimension on JournalEntryLine so expenses and
 * revenues can be rolled up per unit. A CostCenter is created automatically
 * by the accounting engine the first time a unit posts an entry.
 *
 * Pure fields: code, name, description, type, isActive
 * Relations: organization (Organization), unit (Unit, optional),
 *   responsibleUser (User, optional)
 */
import { coreApp } from "../mod.ts";
import {
  boolean,
  coerce,
  defaulted,
  enums,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  organization_excludes,
  unit_excludes,
  user_excludes,
} from "./excludes.ts";

export const costCenter_type_array = ["cost", "profit"] as const;
export const costCenter_type_enums = enums(costCenter_type_array);

export const costCenter_pure = {
  code: string(),
  name: string(),
  description: optional(string()),
  type: defaulted(
    coerce(
      costCenter_type_enums,
      string(),
      (value) => value as typeof costCenter_type_array[number],
    ),
    "cost",
  ),
  isActive: defaulted(boolean(), true),
  ...createUpdateAt,
};

export const costCenter_relations = {
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: false,
    excludes: organization_excludes,
    relatedRelations: {
      costCenters: {
        type: "multiple" as RelationDataType,
        limit: 500,
        sort: {
          field: "code",
          order: "asc" as RelationSortOrderType,
        },
      },
    },
  },
  unit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: true,
    excludes: unit_excludes,
    relatedRelations: {
      costCenters: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "code",
          order: "asc" as RelationSortOrderType,
        },
      },
    },
  },
  responsibleUser: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      responsibleCostCenters: {
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

export const costCenters = () =>
  coreApp.odm.newModel("costCenter", costCenter_pure, costCenter_relations, {
    createIndex: {
      indexSpec: { "organization._id": 1, code: 1 },
      options: { unique: true },
    },
  });
