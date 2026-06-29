/**
 * Ware — Actual product item.
 *
 * The concrete product entity. Links to all 4 classification levels and an
 * optional Manufacturer. Contains base price, brand, and regulatory identifiers
 * (IRC, UMDNS, GTIN). This is the final node in the classification hierarchy
 * before Stuff (store inventory). Denormalized hierarchy relations enable
 * efficient filtering at any level.
 *
 * Pure fields: name, enName, brand, price, orderedNumber, irc, umdns, gtin, photoUrl
 * Relations: manufacturer (Manufacturer), wareType (WareType), wareClass (WareClass),
 *   wareGroup (WareGroup), wareModel (WareModel) —
 *   Lesan auto-creates reverse on all parent models; stuffs from stuff.ware.
 *
 * @example
 * // A specific product: TSH Kit from ZistShimi
 * {
 *   _id: ObjectId("..."),
 *   name: "کیت TSH پیشرفته ZistShimi",
 *   enName: "Advanced TSH Kit ZistShimi",
 *   brand: "ZistShimi",
 *   price: 250000,
 *   orderedNumber: 500,
 *   irc: "1234567890",
 *   umdns: 12345,
 *   gtin: 9876543210123,
 *   photoUrl: "/uploads/tsh_kit.jpg",
 *   createdAt: ISODate("2024-01-01T00:00:00Z"),
 *   updatedAt: ISODate("2024-06-01T12:00:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
  defaulted,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  manufacturer_excludes,
  wareType_excludes,
  wareClass_excludes,
  wareGroup_excludes,
  wareModel_excludes,
} from "./excludes.ts";

export const ware_pure = {
  name: string(),
  enName: optional(string()),
  brand: optional(string()),
  price: number(),
  orderedNumber: defaulted(number(), 0),
  irc: optional(string()),
  umdns: optional(number()),
  gtin: optional(number()),
  photoUrl: optional(string()),
  ...createUpdateAt,
};

export const ware_relations = {
  manufacturer: {
    schemaName: "manufacturer",
    type: "single" as RelationDataType,
    optional: true,
    excludes: manufacturer_excludes,
    relatedRelations: {
      wares: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  wareType: {
    schemaName: "wareType",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareType_excludes,
    relatedRelations: {
      wares: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  wareClass: {
    schemaName: "wareClass",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareClass_excludes,
    relatedRelations: {
      wares: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  wareGroup: {
    schemaName: "wareGroup",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareGroup_excludes,
    relatedRelations: {
      wares: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  wareModel: {
    schemaName: "wareModel",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareModel_excludes,
    relatedRelations: {
      wares: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const wares = () =>
  coreApp.odm.newModel("ware", ware_pure, ware_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        enName: "text",
      },
    },
  });
