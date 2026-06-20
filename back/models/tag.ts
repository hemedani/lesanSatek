import { coreApp } from "../mod.ts";
import {
  type RelationDataType,
  type RelationSortOrderType,
  optional,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { shared_relation_excludes, user_excludes } from "./excludes.ts";

export const tag_pure = {
  name: string(),
  description: optional(string()),
  color: optional(string()),
  icon: optional(string()),
  ...createUpdateAt,
};

export const tag_relations = {
  registrar: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      tags: {
        type: "multiple" as RelationDataType,
        limit: 50,
        excludes: shared_relation_excludes,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
};

export const tags = () =>
  coreApp.odm.newModel("tag", tag_pure, tag_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        description: "text",
      },
    },
  });
