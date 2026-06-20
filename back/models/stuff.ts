import { coreApp } from "../mod.ts";
import {
  boolean,
  date,
  defaulted,
  number,
  optional,
  string,
  type RelationDataType,
  type RelationSortOrderType,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  ware_excludes,
  store_excludes,
  wareType_excludes,
  wareClass_excludes,
  wareGroup_excludes,
  wareModel_excludes,
} from "./excludes.ts";

export const stuff_pure = {
  inventoryNo: number(),
  price: number(),
  hasAbsolutePrice: defaulted(boolean(), false),
  pricePercentage: optional(number()),
  expiration: optional(date()),
  barcode: optional(number()),
  qrc: optional(string()),
  isBarcodeSet: defaulted(boolean(), false),
  isQrcSet: defaulted(boolean(), false),
  isExpirationNear: optional(boolean()),
  photoUrl: optional(string()),
  apiId: optional(string()),
  apiLink: optional(string()),
  availableLongPayment: optional(string()),
  twoMonthPricePercent: optional(number()),
  threeMonthPricePercent: optional(number()),
  fourMonthPricePercent: optional(number()),
  fiveMonthPricePercent: optional(number()),
  sixMonthPricePercent: optional(number()),
  sevenMonthPricePercent: optional(number()),
  eightMonthPricePercent: optional(number()),
  nineMonthPricePercent: optional(number()),
  tenMonthPricePercent: optional(number()),
  elevenMonthPricePercent: optional(number()),
  twelveMonthPricePercent: optional(number()),
  eighteenMonthPricePercent: optional(number()),
  twentyFourMonthPricePercent: optional(number()),
  twoMonth: optional(number()),
  threeMonth: optional(number()),
  fourMonth: optional(number()),
  fiveMonth: optional(number()),
  sixMonth: optional(number()),
  sevenMonth: optional(number()),
  eightMonth: optional(number()),
  nineMonth: optional(number()),
  tenMonth: optional(number()),
  elevenMonth: optional(number()),
  twelveMonth: optional(number()),
  eighteenMonth: optional(number()),
  twentyFourMonth: optional(number()),
  ...createUpdateAt,
};

export const stuff_relations = {
  ware: {
    schemaName: "ware",
    type: "single" as RelationDataType,
    optional: false,
    excludes: ware_excludes,
    relatedRelations: {
      stuffs: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  store: {
    schemaName: "store",
    type: "single" as RelationDataType,
    optional: false,
    excludes: store_excludes,
    relatedRelations: {
      stuffs: {
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
      stuffs: {
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
      stuffs: {
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
      stuffs: {
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
      stuffs: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const stuffs = () =>
  coreApp.odm.newModel("stuff", stuff_pure, stuff_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
      },
    },
  });
