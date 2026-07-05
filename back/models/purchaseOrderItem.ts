/**
 * PurchaseOrderItem — Line item on a purchase order assigned to a store.
 *
 * Created when a tender is awarded: items from the PurchasingRequest's embedded
 * array are materialised as PurchaseOrderItem documents, each assigned to the
 * winning vendor (store). Tracks pricing and lifecycle status
 * (pending → assigned → ordered → received → cancelled).
 *
 * Pure fields: quantity, unitPrice, totalPrice, status
 * Relations: purchasingRequest (PurchasingRequest), assignedFrom (Store),
 *   assignedBy (User), tenderOffer (TenderOffer), wareModel (WareModel),
 *   ware (Ware, optional)
 *
 * @example
 * // A purchase order item assigned to ZistShimi after the tender award
 * // Part of purchasing request pr_tsh
 * {
 *   _id: ObjectId("poi_tsh"),
 *   quantity: 100,
 *   unitPrice: 230000,
 *   totalPrice: 23000000,
 *   status: "assigned",
 *   // Relations (populated via Lesan):
 *   // purchasingRequest → { _id: ObjectId("pr_tsh"), title: "خرید کیت TSH" }
 *   // assignedFrom → { _id: ObjectId("store_zist"), name: "شرکت زیست شیمی" }
 *   // assignedBy → { _id: ObjectId("user_ahmadi"), first_name: "Dr.", last_name: "Ahmadi" }
 *   // wareModel → { _id: ObjectId("wm_tsh"), name: "کیت TSH پیشرفته" }
 *   // ware → { _id: ObjectId("w_tsh_zist"), name: "کیت TSH پیشرفته ZistShimi" }
 *   createdAt: ISODate("2024-06-15T10:00:00Z"),
 *   updatedAt: ISODate("2024-06-15T10:00:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
  coerce,
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
  purchaseOrderItem_excludes,
  purchasingRequest_excludes,
  store_excludes,
  tenderOffer_excludes,
  user_excludes,
  wareModel_excludes,
  ware_excludes,
} from "./excludes.ts";

export const po_item_status_array = ["pending", "assigned", "ordered", "received", "cancelled"];
export const po_item_status_emums = enums(po_item_status_array);

export const purchaseOrderItem_pure = {
  quantity: number(),
  unitPrice: optional(number()),
  totalPrice: optional(number()),
  status: defaulted(
    coerce(
      po_item_status_emums,
      string(),
      (value) => value as typeof po_item_status_array[number],
    ),
    "pending",
  ),
  ...createUpdateAt,
};

export const purchaseOrderItem_relations = {
  purchasingRequest: {
    schemaName: "purchasingRequest",
    type: "single" as RelationDataType,
    optional: false,
    excludes: purchasingRequest_excludes,
    relatedRelations: {
      purchaseOrderItems: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  assignedFrom: {
    schemaName: "store",
    type: "single" as RelationDataType,
    optional: true,
    excludes: store_excludes,
    relatedRelations: {
      purchaseOrderItems: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  assignedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {},
  },
  tenderOffer: {
    schemaName: "tenderOffer",
    type: "single" as RelationDataType,
    optional: true,
    excludes: tenderOffer_excludes,
    relatedRelations: {
      purchaseOrderItem: {
        type: "single" as RelationDataType,
        excludes: purchaseOrderItem_excludes,
      },
    },
  },
  wareModel: {
    schemaName: "wareModel",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareModel_excludes,
    relatedRelations: {
      purchaseOrderItems: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  ware: {
    schemaName: "ware",
    type: "single" as RelationDataType,
    optional: true,
    excludes: ware_excludes,
    relatedRelations: {
      purchaseOrderItems: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const purchaseOrderItems = () =>
  coreApp.odm.newModel(
    "purchaseOrderItem",
    purchaseOrderItem_pure,
    purchaseOrderItem_relations,
  );
