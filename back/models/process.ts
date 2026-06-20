import { coreApp } from "../mod.ts";
import {
  boolean,
  coerce,
  defaulted,
  enums,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { organization_excludes, user_excludes, unit_excludes } from "./excludes.ts";

export const process_status_array = ["Draft", "Active", "Archived"];
export const process_status_emums = enums(process_status_array);

export const process_pure = {
  name: string(),
  description: optional(string()),
  status: defaulted(
    coerce(
      process_status_emums,
      string(),
      (value) => value as typeof process_status_array[number],
    ),
    "Draft",
  ),
  version: defaulted(number(), 1),
  isActive: defaulted(boolean(), false),
  ...createUpdateAt,
};

export const process_relations = {
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: false,
    excludes: organization_excludes,
    relatedRelations: {
      processes: {
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
      createdProcesses: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  assignedUnits: {
    schemaName: "unit",
    type: "multiple" as RelationDataType,
    optional: true,
    excludes: unit_excludes,
    limit: 50,
    sort: {
      field: "_id",
      order: "desc" as RelationSortOrderType,
    },
    relatedRelations: {
      assignedProcesses: {
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

export const processes = () =>
  coreApp.odm.newModel("process", process_pure, process_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        description: "text",
      },
    },
  });
