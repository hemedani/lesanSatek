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
  user_excludes,
  city_excludes,
  state_excludes,
  wareType_excludes,
} from "./excludes.ts";

export const store_pure = {
  name: string(),
  address: optional(string()),
  location: optional(string()),
  contact: optional(string()),
  logoUrl: optional(string()),
  ceoname: optional(string()),
  workingHours: optional(string()),
  cityDeliveryTime: optional(string()),
  stateDeliveryTime: optional(string()),
  selectedStateDeliveryTime: optional(string()),
  countryDeliveryTime: optional(string()),
  availableFastDeliveryTime: optional(string()),
  fastDelivery: defaulted(boolean(), false),
  isAvailableInHolidays: defaulted(boolean(), false),
  status: defaulted(string(), "NotConfirmed"),
  updateStatusDescription: optional(string()),
  score: defaulted(number(), 0),
  totalSoldAmount: defaulted(number(), 0),
  totalSoldNum: defaulted(number(), 0),
  email: optional(string()),
  storeType: optional(string()),
  economicCode: optional(string()),
  postalCode: optional(string()),
  lastNewspaperUrl: optional(string()),
  certificateUrl: optional(string()),
  bankCardNumber: optional(string()),
  shebaNumber: optional(string()),
  nameOfAccountHolder: optional(string()),
  bankName: optional(string()),
  certificateNumber: optional(string()),
  registerNumber: optional(string()),
  certificateExpireDate: optional(date()),
  legalPerson: optional(string()),
  nationalId: optional(string()),
  ...createUpdateAt,
};

export const store_relations = {
  storeHead: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {},
  },
  city: {
    schemaName: "city",
    type: "single" as RelationDataType,
    optional: true,
    excludes: city_excludes,
    relatedRelations: {
      stores: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  state: {
    schemaName: "state",
    type: "single" as RelationDataType,
    optional: true,
    excludes: state_excludes,
    relatedRelations: {},
  },
  wareTypes: {
    schemaName: "wareType",
    type: "multiple" as RelationDataType,
    optional: true,
    limit: 50,
    excludes: wareType_excludes,
    sort: { field: "_id", order: "desc" as RelationSortOrderType },
    relatedRelations: {},
  },
};

export const stores = () =>
  coreApp.odm.newModel("store", store_pure, store_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
      },
    },
  });
