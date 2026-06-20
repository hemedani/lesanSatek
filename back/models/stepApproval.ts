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
