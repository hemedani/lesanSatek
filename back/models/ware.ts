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
