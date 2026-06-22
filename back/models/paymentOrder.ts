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
