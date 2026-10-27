/**
 * AccountingPeriod — Monthly accounting period.
 *
 * Prevents back-posting into closed periods. A period covers an inclusive
 * date range; the accounting engine auto-creates the monthly period for an
 * organization when an entry is posted and no period exists yet.
 *
 * Pure fields: code, name, startDate, endDate, status, closedAt
 * Relations: organization (Organization), fiscalYear (FiscalYear, optional),
 *   closedBy (User, optional)
 */
import { coreApp } from "../mod.ts";
import {
  coerce,
  date,
  defaulted,
  enums,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  fiscalYear_excludes,
  organization_excludes,
  user_excludes,
} from "./excludes.ts";

export const accountingPeriod_status_array = [
  "open",
  "closed",
  "locked",
] as const;
export const accountingPeriod_status_enums = enums(
  accountingPeriod_status_array,
);

export const accountingPeriod_pure = {
  code: string(),
  name: string(),
  startDate: coerce(date(), string(), (value) => new Date(value)),
  endDate: coerce(date(), string(), (value) => new Date(value)),
  status: defaulted(
    coerce(
      accountingPeriod_status_enums,
      string(),
      (value) => value as typeof accountingPeriod_status_array[number],
    ),
    "open",
  ),
  closedAt: optional(coerce(date(), string(), (value) => new Date(value))),
  ...createUpdateAt,
};

export const accountingPeriod_relations = {
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: false,
    excludes: organization_excludes,
    relatedRelations: {
      accountingPeriods: {
        type: "multiple" as RelationDataType,
        limit: 240,
        sort: {
          field: "startDate",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  fiscalYear: {
    schemaName: "fiscalYear",
    type: "single" as RelationDataType,
    optional: true,
    excludes: fiscalYear_excludes,
    relatedRelations: {
      accountingPeriods: {
        type: "multiple" as RelationDataType,
        limit: 240,
        sort: {
          field: "startDate",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  closedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      closedAccountingPeriods: {
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

export const accountingPeriods = () =>
  coreApp.odm.newModel(
    "accountingPeriod",
    accountingPeriod_pure,
    accountingPeriod_relations,
    {
      createIndex: {
        indexSpec: { "organization._id": 1, code: 1 },
        options: { unique: true },
      },
    },
  );
