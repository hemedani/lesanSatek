import { coreApp } from "../mod.ts";
import { optional, type RelationDataType, type RelationSortOrderType, string } from "lesan";
import { createUpdateAt } from "@lib";
import {
  wareType_excludes,
  wareClass_excludes,
} from "./excludes.ts";

export const wareGroup_pure = {
  name: string(),
  enName: optional(string()),
  ...createUpdateAt,
};

export const wareGroup_relations = {
  wareType: {
    schemaName: "wareType",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareType_excludes,
    relatedRelations: {
      wareGroups: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  wareClasses: {
    schemaName: "wareClass",
    type: "multiple" as RelationDataType,
    optional: true,
    limit: 50,
    excludes: wareClass_excludes,
    sort: { field: "_id", order: "desc" as RelationSortOrderType },
    relatedRelations: {
      wareGroups: {
        type: "multiple" as RelationDataType,
      },
    },
  },
};

export const wareGroups = () =>
  coreApp.odm.newModel("wareGroup", wareGroup_pure, wareGroup_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        enName: "text",
      },
    },
  });
