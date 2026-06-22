import { coreApp } from "../mod.ts";
import {
  array,
  boolean,
  coerce,
  defaulted,
  enums,
  number,
  object,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  organization_excludes,
  user_excludes,
  unit_excludes,
} from "./excludes.ts";
import { feature_enums } from "./featureConstants.ts";

export const unit_type_array = ["General", "Warehouse", "Logistics", "Production", "Administration", "Expert"];
export const unit_type_emums = enums(unit_type_array);

export const unit_pure = {
  name: string(),
  enName: optional(string()),
  description: optional(string()),
  isActive: defaulted(boolean(), true),
  type: defaulted(
    coerce(
      unit_type_emums,
      string(),
      (value) => value as typeof unit_type_array[number],
    ),
    "General",
  ),
  address: optional(string()),
  phone: optional(string()),
  email: optional(string()),
  warehouseCapacity: optional(number()),
  hasColdStorage: optional(boolean()),
  fleetSize: optional(number()),
  serviceRadius: optional(number()),
  features: defaulted(array(object({ feature: feature_enums })), []),
  allowWareTypeIds: optional(array(string())),
  allowWareClassIds: optional(array(string())),
  allowWareGroupIds: optional(array(string())),
  allowWareModelIds: optional(array(string())),
  ...createUpdateAt,
};

export const unit_relations = {
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: true,
    excludes: organization_excludes,
    relatedRelations: {
      units: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  parentUnit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: true,
    excludes: unit_excludes,
    relatedRelations: {
      subUnits: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  creator: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      createdUnits: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  head: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      headedUnit: {
        type: "single" as RelationDataType,
        excludes: unit_excludes,
      },
    },
  },
};

export const units = () =>
  coreApp.odm.newModel("unit", unit_pure, unit_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        enName: "text",
        description: "text",
      },
    },
  });
