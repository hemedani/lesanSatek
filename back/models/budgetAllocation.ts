/**
 * BudgetAllocation — Funds assigned to a budget line.
 *
 * Records an allocation of funds to a BudgetLine. The `add` custom action
 * increments the parent BudgetLine's totalAllocated. Each allocation records
 * who allocated it and when.
 *
 * Pure fields: amount, description, allocatedAt
 * Relations: budgetLine (BudgetLine), allocatedBy (User) —
 *   Lesan auto-creates budgetLine.allocations and user.budgetAllocations reverse.
 *
 * @example
 * // An allocation of 100 million IRR to budget line bl_lab, allocated by Ali
 * // The `add` custom action automatically increments bl_lab.totalAllocated
 * {
 *   _id: ObjectId("ba_lab_initial"),
 *   amount: 100000000,
 *   description: "تخصیص اولیه برای خرید کیت‌های TSH",
 *   allocatedAt: ISODate("2024-03-21T08:00:00Z"),
 *   // Relations (populated via Lesan):
 *   // budgetLine → { _id: ObjectId("bl_lab"), code: "BL-1403-001", title: "خرید تجهیزات آزمایشگاهی" }
 *   // allocatedBy → { _id: ObjectId("user_ali"), first_name: "Ali", last_name: "Rezaei" }
 *   createdAt: ISODate("2024-03-21T08:00:00Z"),
 *   updatedAt: ISODate("2024-03-21T08:00:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
  coerce,
  date,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { budgetLine_excludes, user_excludes } from "./excludes.ts";

export const budgetAllocation_pure = {
  amount: number(),
  description: optional(string()),
  allocatedAt: coerce(date(), string(), (value) => new Date(value)),
  ...createUpdateAt,
};

export const budgetAllocation_relations = {
  budgetLine: {
    schemaName: "budgetLine",
    type: "single" as RelationDataType,
    optional: false,
    excludes: budgetLine_excludes,
    relatedRelations: {
      allocations: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  allocatedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      budgetAllocations: {
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

export const budgetAllocations = () =>
  coreApp.odm.newModel("budgetAllocation", budgetAllocation_pure, budgetAllocation_relations);
