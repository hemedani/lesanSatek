/**
 * Tag — Metadata categorization label.
 *
 * Lightweight tagging system for attaching metadata labels to entities.
 * Each tag can have a display name, description, color, and icon.
 *
 * Pure fields: name, description, color, icon
 * Relations: registrar (User)
 *
 * @example
 * // A tag for "Urgent" purchases
 * {
 *   _id: ObjectId("..."),
 *   name: "فوری",
 *   description: "خریدهای فوری و اضطراری",
 *   color: "#FF0000",
 *   icon: "alert-circle",
 *   createdAt: ISODate("2024-01-10T09:00:00Z"),
 *   updatedAt: ISODate("2024-01-10T09:00:00Z")
 * }
 */
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
