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
  purchasingRequest_excludes,
  store_excludes,
  user_excludes,
} from "./excludes.ts";

export const po_item_status_array = ["pending", "assigned", "ordered", "received", "cancelled"];
export const po_item_status_emums = enums(po_item_status_array);

export const purchaseOrderItem_pure = {
  wareModelId: string(),
  wareModelName: string(),
  wareId: optional(string()),
  wareName: optional(string()),
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
    relatedRelations: {},
  },
  assignedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {},
  },
};

export const purchaseOrderItems = () =>
  coreApp.odm.newModel(
    "purchaseOrderItem",
    purchaseOrderItem_pure,
    purchaseOrderItem_relations,
  );
