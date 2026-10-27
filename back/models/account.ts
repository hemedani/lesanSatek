/**
 * Account — Chart of Accounts (CoA) node.
 *
 * Hierarchical accounting account tree. Each account belongs to an
 * Organization and may point to a parent Account. `systemKey` lets the
 * accounting engine resolve automation targets (inventory, accounts payable,
 * cash, COGS, ...) without hard-coding ObjectIds.
 *
 * Pure fields: code, name, enName, description, accountType, normalBalance,
 *   systemKey, level, isPostable, isActive, isSystem
 * Relations: organization (Organization), parentAccount (Account, optional)
 */
import { coreApp } from "../mod.ts";
import {
  boolean,
  defaulted,
  enums,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { account_excludes, organization_excludes } from "./excludes.ts";

export const account_type_array = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
] as const;
export const account_type_enums = enums(account_type_array);

export const account_normal_balance_array = ["debit", "credit"] as const;
export const account_normal_balance_enums = enums(
  account_normal_balance_array,
);

export const account_system_key_array = [
  "inventory",
  "accountsPayable",
  "cash",
  "bank",
  "cogs",
  "operatingExpense",
  "inventoryAdjustment",
  "grni",
  "accountsReceivable",
  "revenue",
  "equity",
  "retainedEarnings",
] as const;
export const account_system_key_enums = enums(account_system_key_array);

export const account_pure = {
  code: string(),
  name: string(),
  enName: optional(string()),
  description: optional(string()),
  accountType: account_type_enums,
  normalBalance: account_normal_balance_enums,
  systemKey: optional(account_system_key_enums),
  level: defaulted(number(), 1),
  isPostable: defaulted(boolean(), true),
  isActive: defaulted(boolean(), true),
  isSystem: defaulted(boolean(), false),
  ...createUpdateAt,
};

export const account_relations = {
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: false,
    excludes: organization_excludes,
    relatedRelations: {
      accounts: {
        type: "multiple" as RelationDataType,
        limit: 500,
        sort: {
          field: "code",
          order: "asc" as RelationSortOrderType,
        },
      },
    },
  },
  parentAccount: {
    schemaName: "account",
    type: "single" as RelationDataType,
    optional: true,
    excludes: account_excludes,
    relatedRelations: {
      childAccounts: {
        type: "multiple" as RelationDataType,
        limit: 500,
        sort: {
          field: "code",
          order: "asc" as RelationSortOrderType,
        },
      },
    },
  },
};

export const accounts = () =>
  coreApp.odm.newModel("account", account_pure, account_relations, {
    createIndex: {
      indexSpec: { "organization._id": 1, code: 1 },
      options: { unique: true },
    },
  });
