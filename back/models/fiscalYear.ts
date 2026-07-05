/**
 * FiscalYear — Annual budget period.
 *
 * Defines a financial year with start/end dates. BudgetLines belong to a FiscalYear.
 * Only one FiscalYear is typically active at a time. Status can be open or closed;
 * closing a fiscal year prevents further budget operations.
 *
 * Pure fields: name, startDate, endDate, isActive, status (open|closed)
 * Relations: (none defined — reverse "budgetLines" is auto-generated from budgetLine.fiscalYear)
 *
 * @example
 * // The 1403 fiscal year (Iranian calendar), currently active and open
 * // Budget lines under this year: bl_lab (خرید تجهیزات آزمایشگاهی)
 * {
 *   _id: ObjectId("fy_1403"),
 *   name: "سال مالی ۱۴۰۳",
 *   startDate: ISODate("2024-03-21T00:00:00Z"),
 *   endDate: ISODate("2025-03-20T23:59:59Z"),
 *   isActive: true,
 *   status: "open",
 *   // Relations (populated via Lesan from budgetLine.fiscalYear):
 *   // budgetLines → [
 *   //   { _id: ObjectId("bl_lab"), code: "BL-1403-001", title: "خرید تجهیزات آزمایشگاهی" },
 *   //   { _id: ObjectId("bl_office"), code: "BL-1403-002", title: "لوازم اداری" }
 *   // ]
 *   createdAt: ISODate("2024-03-01T08:00:00Z"),
 *   updatedAt: ISODate("2024-03-01T08:00:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import { boolean, coerce, date, defaulted, enums, string } from "lesan";
import { createUpdateAt } from "@lib";

export const fiscalYear_status_array = ["open", "closed"];
export const fiscalYear_status_emums = enums(fiscalYear_status_array);

export const fiscalYear_pure = {
  name: string(),
  startDate: coerce(date(), string(), (value) => new Date(value)),
  endDate: coerce(date(), string(), (value) => new Date(value)),
  isActive: defaulted(boolean(), false),
  status: defaulted(
    coerce(
      fiscalYear_status_emums,
      string(),
      (value) => value as typeof fiscalYear_status_array[number],
    ),
    "open",
  ),
  ...createUpdateAt,
};

export const fiscalYear_relations = {};

export const fiscalYears = () =>
  coreApp.odm.newModel("fiscalYear", fiscalYear_pure, fiscalYear_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
      },
    },
  });
