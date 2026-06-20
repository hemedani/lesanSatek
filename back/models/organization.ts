import { coreApp } from "../mod.ts";
import {
  boolean,
  defaulted,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { file_excludes, user_excludes } from "./excludes.ts";

export const organization_pure = {
  name: string(),
  enName: optional(string()),
  description: optional(string()),
  isActive: defaulted(boolean(), true),
  ...createUpdateAt,
};

export const organization_relations = {
  logo: {
    schemaName: "file",
    type: "single" as RelationDataType,
    optional: true,
    excludes: file_excludes,
    relatedRelations: {},
  },
  creator: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      createdOrganizations: {
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
      headedOrganization: {
        type: "single" as RelationDataType,
        excludes: ["createdAt", "updatedAt"],
      },
    },
  },
};

export const organizations = () =>
  coreApp.odm.newModel(
    "organization",
    organization_pure,
    organization_relations,
    {
      createIndex: {
        indexSpec: {
          name: "text",
          enName: "text",
          description: "text",
        },
      },
    },
  );
