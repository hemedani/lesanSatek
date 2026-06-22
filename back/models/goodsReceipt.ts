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
