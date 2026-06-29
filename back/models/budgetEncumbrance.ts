/**
 * BudgetEncumbrance — Budget commitment tracking.
 *
 * Records a reservation of funds (encumbrance) against a BudgetLine when a
 * purchasing request is submitted (optionally) or at other commitment points.
 * Status lifecycle: reserved → spent (when goods received/paid) or released
 * (when cancelled). Custom actions: add (reserves), release, convertToSpend.
 * Converting adjusts totalEncumbered and totalSpent on the parent BudgetLine.
 *
 * Pure fields: amount, status (reserved|spent|released), referenceType,
 *   referenceId, description
 * Relations: budgetLine (BudgetLine), createdBy (User) —
 *   Lesan auto-creates budgetLine.encumbrances and user.budgetEncumbrances reverse.
 *
 * @example
 * // A budget encumbrance created when pr_tsh was submitted.
 * // Status was "reserved" initially, then converted to "spent" when payment was made (markPaid).
 * // The conversion decremented bl_lab.totalEncumbered and incremented bl_lab.totalSpent.
 * {
 *   _id: ObjectId("be_lab_pr1"),
 *   amount: 25000000,
 *   status: "spent",
 *   referenceType: "purchasingRequest",
 *   referenceId: ObjectId("pr_tsh"),
 *   description: "ذخیره بودجه برای خرید کیت TSH",
 *   // Relations (populated via Lesan):
 *   // budgetLine → { _id: ObjectId("bl_lab"), code: "BL-1403-001", title: "خرید تجهیزات آزمایشگاهی" }
 *   // createdBy → { _id: ObjectId("user_ali"), first_name: "Ali", last_name: "Rezaei" }
 *   createdAt: ISODate("2024-06-01T08:00:00Z"),
 *   updatedAt: ISODate("2024-06-25T12:00:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
  enums,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { budgetLine_excludes, user_excludes } from "./excludes.ts";

export const budgetEncumbrance_pure = {
  amount: number(),
  status: enums(["reserved", "spent", "released"]),
  referenceType: string(),
  referenceId: string(),
  description: optional(string()),
  ...createUpdateAt,
};

export const budgetEncumbrance_relations = {
  budgetLine: {
    schemaName: "budgetLine",
    type: "single" as RelationDataType,
    optional: false,
    excludes: budgetLine_excludes,
    relatedRelations: {
      encumbrances: {
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
      budgetEncumbrances: {
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

export const budgetEncumbrances = () =>
  coreApp.odm.newModel("budgetEncumbrance", budgetEncumbrance_pure, budgetEncumbrance_relations);
