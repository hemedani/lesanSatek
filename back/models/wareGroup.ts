/**
 * WareGroup — Third-level product classification.
 *
 * Level 3 of the warehouse hierarchy. Sub-type of WareType, with M:N relationship
 * to WareClass (e.g. "Kit" group can belong to both "Hematology" and "Chemistry"
 * classes). The M:N is defined on WareGroup via `wareClasses` with `relatedRelations`,
 * and no join table is needed — Lesan handles it natively.
 *
 * Pure fields: name, enName
 * Relations: wareType (WareType), wareClasses (WareClass[], M:N) —
 *   Lesan auto-creates wareType.wareGroups and wareClass.wareGroups reverse;
 *   also receives wareModels, wares, stuffs from child models.
 *
 * @example
 * // A "Kit" group that could apply to multiple ware classes
 * {
 *   _id: ObjectId("..."),
 *   name: "کیت",
 *   enName: "Kit",
 *   createdAt: ISODate("2024-01-01T00:00:00Z"),
 *   updatedAt: ISODate("2024-01-01T00:00:00Z")
 * }
 */
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
