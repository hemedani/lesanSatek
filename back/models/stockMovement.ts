/**
 * StockMovement — Audit trail for every inventory change.
 *
 * Read-only model; records are created by the system (inventoryManager) whenever
 * inventory quantity changes. Each entry captures the before/after balance, reason
 * (goods_receipt, goods_issue, transfer_in, transfer_out, consumption, adjustment,
 * return, write_off), and an optional reference to the triggering document
 * (e.g. a GoodsReceipt or ConsumptionRecord).
 *
 * Pure fields: quantity, balanceBefore, balanceAfter, reason,
 *   referenceType, referenceId, description
 * Relations: unit (Unit), createdBy (User), store (Store, optional),
 *   wareModel (WareModel), ware (Ware, optional)
 *
 * @example
 * // A stock movement from goods receipt — 50 TSH kits added to Central Warehouse
 * // Also shows a consumption movement that decremented the Lab's inventory
 * {
 *   _id: ObjectId("sm_gr_tsh"),
 *   quantity: 50,
 *   balanceBefore: 0,
 *   balanceAfter: 50,
 *   reason: "goods_receipt",
 *   referenceType: "goodsReceipt",
 *   referenceId: ObjectId("gr_tsh"),
 *   description: "رسید کالا شماره GR-1403-001",
 *   // Relations (populated via Lesan):
 *   // unit → { _id: ObjectId("unit_warehouse"), name: "انبار مرکزی" }
 *   // createdBy → { _id: ObjectId("user_mehdi"), first_name: "Mehdi", last_name: "Mohammadi" }
 *   // wareModel → { _id: ObjectId("wm_tsh"), name: "کیت TSH پیشرفته" }
 *   createdAt: ISODate("2024-06-20T10:30:00Z"),
 *   updatedAt: ISODate("2024-06-20T10:30:00Z")
 * }
 * // ── Consumption movement that decremented Lab inventory ──
 * // {
 * //   _id: ObjectId("sm_consume_tsh"),
 * //   quantity: -2,
 * //   balanceBefore: 50, balanceAfter: 48,
 * //   reason: "consumption",
 * //   referenceType: "consumptionRecord",
 * //   referenceId: ObjectId("cr_tsh_pat1"),
 * //   unit: { _id: ObjectId("unit_lab") },
 * //   wareModel: { _id: ObjectId("wm_tsh") }
 * // }
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
  store_excludes,
  unit_excludes,
  user_excludes,
  ware_excludes,
  wareModel_excludes,
} from "./excludes.ts";

export const stockMovement_reason_array = [
  "goods_receipt",
  "goods_issue",
  "transfer_in",
  "transfer_out",
  "consumption",
  "adjustment",
  "return",
  "write_off",
];
export const stockMovement_reason_emums = enums(stockMovement_reason_array);

export const stockMovement_pure = {
  quantity: number(),
  balanceBefore: number(),
  balanceAfter: number(),
  reason: defaulted(
    coerce(
      stockMovement_reason_emums,
      string(),
      (value) => value as typeof stockMovement_reason_array[number],
    ),
    "adjustment",
  ),
  referenceType: optional(string()),
  referenceId: optional(string()),
  description: optional(string()),
  ...createUpdateAt,
};

export const stockMovement_relations = {
  unit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: false,
    excludes: unit_excludes,
    relatedRelations: {
      stockMovements: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  createdBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      createdStockMovements: {
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
    optional: true,
    excludes: store_excludes,
    relatedRelations: {
      stockMovements: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  wareModel: {
    schemaName: "wareModel",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareModel_excludes,
    relatedRelations: {
      stockMovements: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  ware: {
    schemaName: "ware",
    type: "single" as RelationDataType,
    optional: true,
    excludes: ware_excludes,
    relatedRelations: {
      stockMovements: {
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

export const stockMovements = () =>
  coreApp.odm.newModel(
    "stockMovement",
    stockMovement_pure,
    stockMovement_relations,
  );
