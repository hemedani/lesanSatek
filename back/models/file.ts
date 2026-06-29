/**
 * File — Uploaded file metadata.
 *
 * Tracks uploaded files (images, videos, documents, etc.) with MIME type, size,
 * and an optional uploader relation. Used as an attachment across the system
 * (avatars, logos, purchasing request attachments, certificates, etc.).
 *
 * Pure fields: name, mimeType, size, type (image|video|docs|other), alt_text
 * Relations: uploader (User)
 *
 * @example
 * // A profile picture uploaded by a user
 * {
 *   _id: ObjectId("..."),
 *   name: "profile_photo_2024.jpg",
 *   mimeType: "image/jpeg",
 *   size: 245760,
 *   type: "image",
 *   alt_text: "John Doe's profile picture",
 *   createdAt: ISODate("2024-01-15T10:30:00Z"),
 *   updatedAt: ISODate("2024-01-15T10:30:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
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
import { user_excludes } from "./excludes.ts";

export const file_type_array = ["image", "video", "docs", "other"];
export const file_type_emums = enums(file_type_array);

export const file_pure = {
  name: string(),
  mimeType: string(),
  size: number(),
  type: defaulted(
    coerce(
      file_type_emums,
      string(),
      (value) => value as typeof file_type_array[number],
    ),
    "other",
  ),
  alt_text: optional(string()),
  ...createUpdateAt,
};

export const file_relations = {
  uploader: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      files: {
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

export const files = () =>
  coreApp.odm.newModel("file", file_pure, file_relations);
