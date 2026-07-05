/**
 * TenderOffer — Vendor bid on a tender.
 *
 * Submitted by a store (vendor) in response to a tender. Contains pricing,
 * delivery time, payment terms, and status (submitted → accepted/rejected).
 * On tender award, the winning offer is accepted and all others rejected.
 *
 * Pure fields: price, deliveryTime, paymentTerms, description,
 *   status (submitted|accepted|rejected), submittedAt
 * Relations: tender (Tender), store (Store).
 * Note: tenderOffer.purchaseOrderItem is auto-generated from purchaseOrderItem.tenderOffer.
 *
 * @example
 * // ZistShimi's winning offer on tender_tsh — accepted after the tender award
 * {
 *   _id: ObjectId("offer_zist"),
 *   price: 23000000,
 *   deliveryTime: 7,
 *   paymentTerms: "30 روزه",
 *   description: "قیمت هر کیت ۲۳۰,۰۰۰ تومان، تحویل ۷ روزه",
 *   status: "accepted",
 *   submittedAt: ISODate("2024-06-20T14:00:00Z"),
 *   // Relations (populated via Lesan):
 *   // tender → { _id: ObjectId("tender_tsh"), title: "مناقصه کیت TSH" }
 *   // store → { _id: ObjectId("store_zist"), name: "شرکت زیست شیمی" }
 *   createdAt: ISODate("2024-06-20T14:00:00Z"),
 *   updatedAt: ISODate("2024-06-25T10:00:00Z")
 * }
 */
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
