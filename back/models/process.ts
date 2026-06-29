/**
 * Process — Workflow process definition.
 *
 * Defines a purchasing workflow (Draft → Active → Archived) that governs how
 * PurchasingRequests flow through approval steps. Custom actions: activateProcess
 * (validates steps and transitions to Active), duplicateProcess (clones process + steps).
 *
 * Pure fields: name, description, status (Draft|Active|Archived), version, isActive
 * Relations: organization (Organization), createdBy (User)
 *
 * @example
 * // An active procurement process for the hospital, created by Ali
 * {
 *   _id: ObjectId("proc_lab"),
 *   name: "فرآیند خرید تجهیزات پزشکی",
 *   description: "فرآیند تأمین و خرید تجهیزات پزشکی بیمارستان",
 *   status: "Active",
 *   version: 2,
 *   isActive: true,
 *   // Relations (populated via Lesan):
 *   // organization → { _id: ObjectId("org_beheshti"), name: "بیمارستان شهید بهشتی" }
 *   // createdBy → { _id: ObjectId("user_ali"), first_name: "Ali", last_name: "Rezaei" }
 *   // steps (auto-generated, sorted by order): [
 *   //   { _id: ObjectId("step1"), name: "تأیید مدیر خرید", order: 1, stepType: "Approval" },
 *   //   { _id: ObjectId("step2"), name: "بررسی انبار", order: 2, stepType: "Review" },
 *   //   { _id: ObjectId("step3"), name: "تأیید نهایی آزمایشگاه", order: 3, stepType: "Approval" }
 *   // ]
 *   createdAt: ISODate("2023-10-01T08:00:00Z"),
 *   updatedAt: ISODate("2024-05-20T09:00:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
  boolean,
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
import { organization_excludes, user_excludes } from "./excludes.ts";

export const process_status_array = ["Draft", "Active", "Archived"];
export const process_status_emums = enums(process_status_array);

export const process_pure = {
  name: string(),
  description: optional(string()),
  status: defaulted(
    coerce(
      process_status_emums,
      string(),
      (value) => value as typeof process_status_array[number],
    ),
    "Draft",
  ),
  version: defaulted(number(), 1),
  isActive: defaulted(boolean(), false),
  ...createUpdateAt,
};

export const process_relations = {
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: false,
    excludes: organization_excludes,
    relatedRelations: {
      processes: {
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
      createdProcesses: {
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

export const processes = () =>
  coreApp.odm.newModel("process", process_pure, process_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        description: "text",
      },
    },
  });
