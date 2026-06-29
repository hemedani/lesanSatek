/**
 * WareClass — Second-level product classification.
 *
 * Level 2 of the warehouse hierarchy. Sub-type of a WareType (e.g. "Hematology"
 * under "Laboratory Equipment"). Has an M:N relationship with WareGroup
 * (defined on wareGroup.wareClasses) allowing flexible cross-classification.
 *
 * Pure fields: name, enName
 * Relations: wareType (WareType) — Lesan auto-creates wareType.wareClasses reverse;
 *   also receives auto-generated wareGroups (M:N from wareGroup.wareClasses),
 *   wareModels, wares, and stuffs from child models.
 *
 * @example
 * // Hematology sub-category under Laboratory Equipment
 * {
 *   _id: ObjectId("..."),
 *   name: "هماتولوژی",
 *   enName: "Hematology",
 *   createdAt: ISODate("2024-01-01T00:00:00Z"),
 *   updatedAt: ISODate("2024-01-01T00:00:00Z")
 * }
 */
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
