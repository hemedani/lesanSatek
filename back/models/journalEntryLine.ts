/**
 * JournalEntryLine — Debit/credit line of a JournalEntry.
 *
 * Denormalizes organization, period, cost center and store so financial
 * reports can aggregate a single collection without lookups. Exactly one of
 * `debit` / `credit` is non-zero; the engine enforces the balance invariant.
 *
 * Pure fields: lineNumber, description, debit, credit
 * Relations: journalEntry (JournalEntry), account (Account),
 *   organization (Organization), period (AccountingPeriod),
 *   costCenter (CostCenter, optional), store (Store, optional)
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
  account_excludes,
  accountingPeriod_excludes,
  costCenter_excludes,
  journalEntry_excludes,
  organization_excludes,
  store_excludes,
} from "./excludes.ts";

export const journalEntryLine_pure = {
  lineNumber: number(),
  description: optional(string()),
  debit: defaulted(number(), 0),
  credit: defaulted(number(), 0),
  ...createUpdateAt,
};

export const journalEntryLine_relations = {
  journalEntry: {
    schemaName: "journalEntry",
    type: "single" as RelationDataType,
    optional: false,
    excludes: journalEntry_excludes,
    relatedRelations: {
      lines: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: {
          field: "lineNumber",
          order: "asc" as RelationSortOrderType,
        },
      },
    },
  },
  account: {
    schemaName: "account",
    type: "single" as RelationDataType,
    optional: false,
    excludes: account_excludes,
    relatedRelations: {
      journalEntryLines: {
        type: "multiple" as RelationDataType,
        limit: 100,
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
      journalEntryLines: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: {
          field: "_id",
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
      journalEntryLines: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  costCenter: {
    schemaName: "costCenter",
    type: "single" as RelationDataType,
    optional: true,
    excludes: costCenter_excludes,
    relatedRelations: {
      journalEntryLines: {
        type: "multiple" as RelationDataType,
        limit: 100,
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
      journalEntryLines: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
};

export const journalEntryLines = () =>
  coreApp.odm.newModel(
    "journalEntryLine",
    journalEntryLine_pure,
    journalEntryLine_relations,
    {
      createIndex: {
        indexSpec: {
          "organization._id": 1,
          "account._id": 1,
          "journalEntry.entryDate": -1,
        },
      },
    },
  );
