import { coreApp } from "../mod.ts";
import {
  coerce,
  date,
  defaulted,
  enums,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  tender_excludes,
  store_excludes,
} from "./excludes.ts";

export const tenderOffer_status_array = ["submitted", "accepted", "rejected"];
export const tenderOffer_status_emums = enums(tenderOffer_status_array);

export const tenderOffer_pure = {
  price: number(),
  deliveryTime: number(),
  paymentTerms: optional(string()),
  description: optional(string()),
  status: defaulted(
    coerce(
      tenderOffer_status_emums,
      string(),
      (value) => value as typeof tenderOffer_status_array[number],
    ),
    "submitted",
  ),
  submittedAt: coerce(date(), string(), (value) => new Date(value)),
  ...createUpdateAt,
};

export const tenderOffer_relations = {
  tender: {
    schemaName: "tender",
    type: "single" as RelationDataType,
    optional: false,
    excludes: tender_excludes,
    relatedRelations: {
      offers: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  store: {
    schemaName: "store",
    type: "single" as RelationDataType,
    optional: false,
    excludes: store_excludes,
    relatedRelations: {
      tenderOffers: {
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

export const tenderOffers = () =>
  coreApp.odm.newModel("tenderOffer", tenderOffer_pure, tenderOffer_relations);
