/**
 * GoodsReceipt — Incoming goods receipt document.
 *
 * Documents the physical receipt of ordered goods. Contains embedded items
 * tracking received/accepted/rejected quantities per purchase order item.
 * The `add` custom action triggers a comprehensive automated flow:
 * inventoryManager.addStock() → PO item status update → workflow auto-advance
 * → draft PaymentOrder creation → budget encumbrance conversion.
 *
 * Pure fields: receiptNumber, description, receivedAt, status, notes,
 *   items[{purchaseOrderItemId, wareModelId, quantityReceived,
 *   quantityAccepted, quantityRejected, batchNo, expirationDate}]
 * Relations: purchasingRequest (PurchasingRequest), receivedBy (User),
 *   receivingUnit (Unit)
 *
 * @example
 * // A completed goods receipt for TSH kits (98 accepted, 2 rejected)
 * // The `add` custom action will auto-create inventory records, update PO items,
 * // advance the workflow, and create a draft PaymentOrder
 * {
 *   _id: ObjectId("gr_tsh"),
 *   receiptNumber: "GR-1403-001",
 *   description: "رسید کالای سفارش خرید شماره PO-001",
 *   receivedAt: ISODate("2024-06-20T10:00:00Z"),
 *   status: "completed",
 *   notes: "۲ عدد کیت آسیب دیده بود",
 *   items: [
 *     {
 *       purchaseOrderItemId: ObjectId("poi_tsh"),
 *       wareModelId: "wm_tsh",
 *       quantityReceived: 100,
 *       quantityAccepted: 98,
 *       quantityRejected: 2,
 *       batchNo: "BATCH-2024-001",
 *       expirationDate: ISODate("2025-06-01")
 *     }
 *   ],
 *   // Relations (populated via Lesan):
 *   // purchasingRequest → { _id: ObjectId("pr_tsh"), title: "خرید کیت TSH" }
 *   // receivedBy → { _id: ObjectId("user_mehdi"), first_name: "Mehdi", last_name: "Mohammadi" }
 *   // receivingUnit → { _id: ObjectId("unit_warehouse"), name: "انبار مرکزی" }
 *   createdAt: ISODate("2024-06-20T10:00:00Z"),
 *   updatedAt: ISODate("2024-06-20T10:30:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
  array,
  coerce,
  date,
  defaulted,
  enums,
  number,
  object,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  purchasingRequest_excludes,
  user_excludes,
  unit_excludes,
} from "./excludes.ts";

export const goodsReceipt_status_array = ["pending", "completed", "partially_rejected"];
export const goodsReceipt_status_emums = enums(goodsReceipt_status_array);

export const goodsReceipt_pure = {
  receiptNumber: string(),
  description: optional(string()),
  receivedAt: coerce(date(), string(), (value) => new Date(value)),
  status: defaulted(
    coerce(
      goodsReceipt_status_emums,
      string(),
      (value) => value as typeof goodsReceipt_status_array[number],
    ),
    "pending",
  ),
  notes: optional(string()),
  items: defaulted(
    array(object({
      purchaseOrderItemId: string(),
      wareModelId: string(),
      quantityReceived: number(),
      quantityAccepted: number(),
      quantityRejected: number(),
      batchNo: optional(string()),
      expirationDate: optional(coerce(date(), string(), (value) => new Date(value))),
    })),
    [],
  ),
  ...createUpdateAt,
};

export const goodsReceipt_relations = {
  purchasingRequest: {
    schemaName: "purchasingRequest",
    type: "single" as RelationDataType,
    optional: false,
    excludes: purchasingRequest_excludes,
    relatedRelations: {
      goodsReceipts: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  receivedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      receivedGoods: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  receivingUnit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: false,
    excludes: unit_excludes,
    relatedRelations: {
      goodsReceipts: {
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

export const goodsReceipts = () =>
  coreApp.odm.newModel("goodsReceipt", goodsReceipt_pure, goodsReceipt_relations);
