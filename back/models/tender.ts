/**
 * Tender — RFP/RFQ for vendor selection.
 *
 * Represents a tender process for vendor bidding. Linked to a PurchasingRequest;
 * vendors (Stores) submit TenderOffers. The tender can be closed (stop accepting
 * offers) and awarded (select winning bid), which triggers PurchaseOrderItem creation.
 *
 * Pure fields: title, description, status (open|closed|awarded|cancelled), deadline
 * Relations: purchasingRequest (PurchasingRequest), createdBy (User),
 *   assignedVendors (Store[]), offers (TenderOffer[])
 *
 * @example
 * // An awarded tender for lab kits, linked to purchasing request pr_tsh
 * // Two vendors submitted offers; ZistShimi won
 * {
 *   _id: ObjectId("tender_tsh"),
 *   title: "مناقصه خرید کیت‌های آزمایشگاهی",
 *   description: "تأمین ۱۰۰ عدد کیت TSH",
 *   status: "awarded",
 *   deadline: ISODate("2024-07-01T12:00:00Z"),
 *   // Relations (populated via Lesan):
 *   // purchasingRequest → { _id: ObjectId("pr_tsh"), title: "خرید کیت TSH" }
 *   // createdBy → { _id: ObjectId("user_ali"), first_name: "Ali", last_name: "Rezaei" }
 *   // assignedVendors → [
 *   //   { _id: ObjectId("store_zist"), name: "شرکت زیست شیمی" },
 *   //   { _id: ObjectId("store_salamat"), name: "شرکت تجهیزات پزشکی سلامت" }
 *   // ]
 *   // offers → [
 *   //   { _id: ObjectId("offer_zist"), store: { name: "شرکت زیست شیمی" }, price: 23000000, status: "accepted" },
 *   //   { _id: ObjectId("offer_salamat"), store: { name: "شرکت تجهیزات پزشکی سلامت" }, price: 24500000, status: "rejected" }
 *   // ]
 *   createdAt: ISODate("2024-06-10T08:00:00Z"),
 *   updatedAt: ISODate("2024-06-20T09:00:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
  coerce,
  date,
  defaulted,
  enums,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  purchasingRequest_excludes,
  user_excludes,
  store_excludes,
} from "./excludes.ts";

export const tender_status_array = ["open", "closed", "awarded", "cancelled"];
export const tender_status_emums = enums(tender_status_array);

export const tender_pure = {
  title: string(),
  description: optional(string()),
  status: defaulted(
    coerce(
      tender_status_emums,
      string(),
      (value) => value as typeof tender_status_array[number],
    ),
    "open",
  ),
  deadline: coerce(date(), string(), (value) => new Date(value)),
  ...createUpdateAt,
};

export const tender_relations = {
  purchasingRequest: {
    schemaName: "purchasingRequest",
    type: "single" as RelationDataType,
    optional: false,
    excludes: purchasingRequest_excludes,
    relatedRelations: {
      tender: {
        type: "single" as RelationDataType,
        excludes: purchasingRequest_excludes,
      },
    },
  },
  createdBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      createdTenders: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  assignedVendors: {
    schemaName: "store",
    type: "multiple" as RelationDataType,
    optional: true,
    excludes: store_excludes,
    limit: 50,
    sort: {
      field: "_id",
      order: "desc" as RelationSortOrderType,
    },
    relatedRelations: {
      tenders: {
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

export const tenders = () =>
  coreApp.odm.newModel("tender", tender_pure, tender_relations, {
    createIndex: {
      indexSpec: {
        title: "text",
        description: "text",
      },
    },
  });
