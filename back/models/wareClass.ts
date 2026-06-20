import { coreApp } from "../mod.ts";
import { optional, type RelationDataType, type RelationSortOrderType, string } from "lesan";
import { createUpdateAt } from "@lib";
import {
  wareType_excludes,
} from "./excludes.ts";

export const wareClass_pure = {
  name: string(),
  enName: optional(string()),
  ...createUpdateAt,
};

export const wareClass_relations = {
  wareType: {
    schemaName: "wareType",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareType_excludes,
    relatedRelations: {
      wareClasses: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const wareClasses = () =>
  coreApp.odm.newModel("wareClass", wareClass_pure, wareClass_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        enName: "text",
      },
    },
  });
