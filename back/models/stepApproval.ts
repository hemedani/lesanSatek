/**
 * StepApproval — Per-unit, per-step approval decision on a purchasing request.
 *
 * Tracks each unit's decision (pending|approved|rejected) for a specific step
 * within a PurchasingRequest's workflow. Created automatically when the request
 * reaches a step. The `submitDecision` custom action processes a unit's vote,
 * evaluates the step via `evaluateStepStatus()`, and auto-advances the request
 * or marks it rejected/completed.
 *
 * Pure fields: status (pending|approved|rejected), comment, decidedAt
 * Relations: purchasingRequest (PurchasingRequest), processStep (ProcessStep),
 *   unit (Unit), decidedBy (User)
 *
 * @example
 * // An approved decision by the Central Warehouse for step 1 of purchasing request pr_tsh
 * {
 *   _id: ObjectId("sa_step1_warehouse"),
 *   status: "approved",
 *   comment: "تأیید شد. موجودی انبار کافی است.",
 *   decidedAt: ISODate("2024-06-10T11:30:00Z"),
 *   // Relations (populated via Lesan):
 *   // purchasingRequest → { _id: ObjectId("pr_tsh"), title: "خرید کیت TSH" }
 *   // processStep → { _id: ObjectId("step1"), name: "تأیید مدیر خرید", order: 1 }
 *   // unit → { _id: ObjectId("unit_warehouse"), name: "انبار مرکزی" }
 *   // decidedBy → { _id: ObjectId("user_ahmadi"), first_name: "Dr.", last_name: "Ahmadi" }
 *   createdAt: ISODate("2024-06-05T08:00:00Z"),
 *   updatedAt: ISODate("2024-06-10T11:30:00Z")
 * }
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
import {
  purchasingRequest_excludes,
  processStep_excludes,
  unit_excludes,
  user_excludes,
} from "./excludes.ts";

export const approval_status_array = ["pending", "approved", "rejected"];
export const approval_status_emums = enums(approval_status_array);

export const stepApproval_pure = {
  status: defaulted(
    coerce(
      approval_status_emums,
      string(),
      (value) => value as typeof approval_status_array[number],
    ),
    "pending",
  ),
  comment: optional(string()),
  decidedAt: optional(coerce(date(), string(), (value) => new Date(value))),
};

export const stepApproval_relations = {
  purchasingRequest: {
    schemaName: "purchasingRequest",
    type: "single" as RelationDataType,
    optional: false,
    excludes: purchasingRequest_excludes,
    relatedRelations: {
      stepApprovals: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  processStep: {
    schemaName: "processStep",
    type: "single" as RelationDataType,
    optional: false,
    excludes: processStep_excludes,
    relatedRelations: {
      approvals: {
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
    optional: false,
    excludes: unit_excludes,
    relatedRelations: {
      stepApprovals: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  decidedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      stepDecisions: {
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

export const stepApprovals = () =>
  coreApp.odm.newModel("stepApproval", stepApproval_pure, stepApproval_relations);
