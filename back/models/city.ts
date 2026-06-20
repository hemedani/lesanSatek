import { coreApp } from "../mod.ts";
import { optional, type RelationDataType, type RelationSortOrderType, string } from "lesan";
import { createUpdateAt } from "@lib";
import { state_excludes } from "./excludes.ts";

export const city_pure = {
  name: string(),
  enName: optional(string()),
  ...createUpdateAt,
};

export const city_relations = {
  state: {
    schemaName: "state",
    type: "single" as RelationDataType,
    optional: false,
    excludes: state_excludes,
    relatedRelations: {
      cities: {
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

export const cities = () =>
  coreApp.odm.newModel("city", city_pure, city_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        enName: "text",
      },
    },
  });
