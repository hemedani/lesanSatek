/**
 * JournalEntry — Double-entry journal header.
 *
 * Every entry is immutable once posted. `idempotencyKey` is unique so retried
 * event hooks can never duplicate an entry. `lineSnapshot` stores the exact
 * debit/credit lines and is used to repair `JournalEntryLine` documents if a
 * write is interrupted between the header and its lines.
 *
 * Pure fields: entryNumber, entryDate, description, reference, sourceType,
 *   sourceId, sourceEvent, status, totalDebit, totalCredit, isBalanced,
 *   idempotencyKey, postedAt, lineSnapshot
 * Relations: organization (Organization), period (AccountingPeriod),
 *   createdBy (User, optional)
 */
import { coreApp } from "../mod.ts";
import {
  array,
  boolean,
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
  accountingPeriod_excludes,
  journalEntry_excludes,
  organization_excludes,
  user_excludes,
} from "./excludes.ts";

export const journalEntry_source_type_array = [
  "goodsReceipt",
  "consumption",
  "paymentOrder",
  "budget",
  "manual",
  "adjustment",
  "opening",
  "reversal",
] as const;
export const journalEntry_source_type_enums = enums(
  journalEntry_source_type_array,
);

export const journalEntry_status_array = [
  "draft",
  "posted",
  "reversed",
] as const;
export const journalEntry_status_enums = enums(journalEntry_status_array);

export const journalEntryLineSnapshot_pure = {
  lineNumber: number(),
  accountId: string(),
  accountCode: optional(string()),
  accountName: optional(string()),
  accountType: optional(string()),
  normalBalance: optional(string()),
  description: optional(string()),
  debit: defaulted(number(), 0),
  credit: defaulted(number(), 0),
  costCenterId: optional(string()),
  costCenterName: optional(string()),
  unitId: optional(string()),
  storeId: optional(string()),
};

export const journalEntry_pure = {
  entryNumber: string(),
  entryDate: coerce(date(), string(), (value) => new Date(value)),
  description: optional(string()),
  reference: optional(string()),
  sourceType: journalEntry_source_type_enums,
  sourceId: optional(string()),
  sourceEvent: optional(string()),
  status: defaulted(
    coerce(
      journalEntry_status_enums,
      string(),
      (value) => value as typeof journalEntry_status_array[number],
    ),
    "posted",
  ),
  totalDebit: defaulted(number(), 0),
  totalCredit: defaulted(number(), 0),
  isBalanced: defaulted(boolean(), true),
  idempotencyKey: string(),
  postedAt: optional(coerce(date(), string(), (value) => new Date(value))),
  lineSnapshot: defaulted(
    array(object(journalEntryLineSnapshot_pure)),
    [],
  ),
  ...createUpdateAt,
};

export const journalEntry_relations = {
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: false,
    excludes: organization_excludes,
    relatedRelations: {
      journalEntries: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: {
          field: "entryDate",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  period: {
    schemaName: "accountingPeriod",
    type: "single" as RelationDataType,
    optional: false,
    excludes: accountingPeriod_excludes,
    relatedRelations: {
      journalEntries: {
        type: "multiple" as RelationDataType,
        limit: 500,
        sort: {
          field: "entryDate",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  createdBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      journalEntries: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: {
          field: "entryDate",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  reversalOf: {
    schemaName: "journalEntry",
    type: "single" as RelationDataType,
    optional: true,
    excludes: journalEntry_excludes,
    relatedRelations: {
      reversedBy: {
        type: "multiple" as RelationDataType,
        limit: 10,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
};

export const journalEntries = () =>
  coreApp.odm.newModel(
    "journalEntry",
    journalEntry_pure,
    journalEntry_relations,
    {
      createIndex: {
        indexSpec: { idempotencyKey: 1 },
        options: { unique: true },
      },
    },
  );
