/**
 * PaymentOrder — Payment authorization document.
 *
 * Represents a payment order to a vendor (Store). Automatically created as
 * "draft" when a GoodsReceipt is completed. The `markPaid` custom action
 * sets status to "paid" and converts all reserved budget encumbrances linked
 * to the same PurchasingRequest to "spent".
 *
 * Pure fields: title, amount, description, status (draft|sent_to_finance|paid|cancelled), paidAt
 * Relations: purchasingRequest (PurchasingRequest), issuedBy (User),
 *   approvedBy (User, optional), payTo (Store), financialUnit (Unit)
 *
 * @example
 * // A paid payment order for 98 accepted TSH kits (230,000 × 98)
 * // Auto-created as "draft" by goodsReceipt.add, then marked "paid" via markPaid action
 * {
 *   _id: ObjectId("po_tsh"),
 *   title: "پرداخت خرید کیت TSH",
 *   amount: 22540000,
 *   description: "پرداخت بابت خرید ۹۸ عدد کیت TSH (۲۳۰,۰۰۰ × ۹۸)",
 *   status: "paid",
 *   paidAt: ISODate("2024-06-25T12:00:00Z"),
 *   // Relations (populated via Lesan):
 *   // purchasingRequest → { _id: ObjectId("pr_tsh"), title: "خرید کیت TSH" }
 *   // issuedBy → { _id: ObjectId("user_ali"), first_name: "Ali", last_name: "Rezaei" }
 *   // approvedBy → { _id: ObjectId("..."), first_name: "Manager" }
 *   // payTo → { _id: ObjectId("store_zist"), name: "شرکت زیست شیمی" }
 *   // financialUnit → { _id: ObjectId("unit_purchasing"), name: "واحد خرید" }
 *   createdAt: ISODate("2024-06-20T10:30:00Z"),
 *   updatedAt: ISODate("2024-06-25T12:00:00Z")
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
  purchasingRequest_excludes,
  user_excludes,
  store_excludes,
  unit_excludes,
} from "./excludes.ts";

export const paymentOrder_status_array = ["draft", "sent_to_finance", "paid", "cancelled"];
export const paymentOrder_status_emums = enums(paymentOrder_status_array);

export const paymentOrder_pure = {
  title: string(),
  amount: number(),
  description: optional(string()),
  status: defaulted(
    coerce(
      paymentOrder_status_emums,
      string(),
      (value) => value as typeof paymentOrder_status_array[number],
    ),
    "draft",
  ),
  paidAt: optional(coerce(date(), string(), (value) => new Date(value))),
  ...createUpdateAt,
};

export const paymentOrder_relations = {
  purchasingRequest: {
    schemaName: "purchasingRequest",
    type: "single" as RelationDataType,
    optional: false,
    excludes: purchasingRequest_excludes,
    relatedRelations: {
      paymentOrders: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  issuedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      issuedPaymentOrders: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  approvedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      approvedPaymentOrders: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  payTo: {
    schemaName: "store",
    type: "single" as RelationDataType,
    optional: false,
    excludes: store_excludes,
    relatedRelations: {
      paymentOrders: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  financialUnit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: false,
    excludes: unit_excludes,
    relatedRelations: {
      paymentOrders: {
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

export const paymentOrders = () =>
  coreApp.odm.newModel("paymentOrder", paymentOrder_pure, paymentOrder_relations);
