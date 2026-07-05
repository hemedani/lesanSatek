/**
 * BudgetLine — Spending category within a fiscal year.
 *
 * Represents a budget account/category with allocated, encumbered, spent, and
 * remaining amounts. Each line belongs to a FiscalYear and an Organization,
 * and can optionally be scoped to a specific Unit or WareType. Custom actions:
 * getBudgetReport, getYearEndReport.
 *
 * Pure fields: code, title, description, totalAllocated, totalEncumbered,
 *   totalSpent, remainingBudget
 * Relations: fiscalYear (FiscalYear), organization (Organization),
 *   unit (Unit, optional), wareType (WareType, optional) —
 *   Lesan auto-creates reverse relations on all parents;
 *   allocations (BudgetAllocation[]), encumbrances (BudgetEncumbrance[]),
 *   and purchasingRequests (PurchasingRequest[]) are auto-generated from child models.
 *
 * @example
 * // Budget line for lab equipment, under fiscal year fy_1403 and org_beheshti
 * // Has one allocation (100M from ba_lab_initial) and one encumbrance (25M from be_lab_pr1)
 * // The remaining budget decreased from 500M to 475M after the encumbrance
 * {
 *   _id: ObjectId("bl_lab"),
 *   code: "BL-1403-001",
 *   title: "خرید تجهیزات آزمایشگاهی",
 *   description: "بودجه خرید تجهیزات و کیت‌های آزمایشگاهی",
 *   totalAllocated: 500000000,
 *   totalEncumbered: 25000000,
 *   totalSpent: 22540000,
 *   remainingBudget: 452460000,
 *   // Relations (populated via Lesan):
 *   // fiscalYear → { _id: ObjectId("fy_1403"), name: "سال مالی ۱۴۰۳" }
 *   // organization → { _id: ObjectId("org_beheshti"), name: "بیمارستان شهید بهشتی" }
 *   // unit → { _id: ObjectId("unit_lab"), name: "آزمایشگاه هماتولوژی" }
 *   // wareType → { _id: ObjectId("wt_lab"), name: "تجهیزات آزمایشگاهی" }
 *   // allocations → [{ _id: ObjectId("ba_lab_initial"), amount: 100000000 }]
 *   // encumbrances → [
 *   //   { _id: ObjectId("be_lab_pr1"), amount: 25000000, status: "spent" }
 *   // ]
 *   createdAt: ISODate("2024-03-21T08:00:00Z"),
 *   updatedAt: ISODate("2024-06-25T12:00:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
  defaulted,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  fiscalYear_excludes,
  organization_excludes,
  unit_excludes,
  wareType_excludes,
} from "./excludes.ts";

export const budgetLine_pure = {
  code: string(),
  title: string(),
  description: optional(string()),
  totalAllocated: defaulted(number(), 0),
  totalEncumbered: defaulted(number(), 0),
  totalSpent: defaulted(number(), 0),
  remainingBudget: defaulted(number(), 0),
  ...createUpdateAt,
};

export const budgetLine_relations = {
  fiscalYear: {
    schemaName: "fiscalYear",
    type: "single" as RelationDataType,
    optional: false,
    excludes: fiscalYear_excludes,
    relatedRelations: {
      budgetLines: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: false,
    excludes: organization_excludes,
    relatedRelations: {
      budgetLines: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  unit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: true,
    excludes: unit_excludes,
    relatedRelations: {
      budgetLines: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  wareType: {
    schemaName: "wareType",
    type: "single" as RelationDataType,
    optional: true,
    excludes: wareType_excludes,
    relatedRelations: {
      budgetLines: {
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

export const budgetLines = () =>
  coreApp.odm.newModel("budgetLine", budgetLine_pure, budgetLine_relations, {
    createIndex: {
      indexSpec: {
        code: "text",
        title: "text",
      },
    },
  });
