import { coreApp } from "../mod.ts";
import {
  coerce,
  date,
  defaulted,
  enums,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  process_excludes,
  user_excludes,
  unit_excludes,
  file_excludes,
  stepApproval_excludes,
  purchasingRequest_excludes,
} from "./excludes.ts";

export const request_status_array = [
  "Draft",
  "Pending",
  "InProgress",
  "Approved",
  "Rejected",
  "Completed",
  "Cancelled",
];
export const request_status_emums = enums(request_status_array);

export const purchasingRequest_pure = {
  title: string(),
  description: optional(string()),
  amount: optional(number()),
  status: defaulted(
    coerce(
      request_status_emums,
      string(),
      (value) => value as typeof request_status_array[number],
    ),
    "Draft",
  ),
  currentStep: defaulted(number(), 0),
  requestedAt: optional(coerce(date(), string(), (value) => new Date(value))),
  completedAt: optional(coerce(date(), string(), (value) => new Date(value))),
  ...createUpdateAt,
};

export const purchasingRequest_relations = {
  process: {
    schemaName: "process",
    type: "single" as RelationDataType,
    optional: false,
    excludes: process_excludes,
    relatedRelations: {
      requests: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  requester: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      requests: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  requestingUnit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: true,
    excludes: unit_excludes,
    relatedRelations: {
      purchaseRequests: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  attachments: {
    schemaName: "file",
    type: "multiple" as RelationDataType,
    optional: true,
    excludes: file_excludes,
    limit: 50,
    sort: {
      field: "_id",
      order: "desc" as RelationSortOrderType,
    },
    relatedRelations: {},
  },
  stepApprovals: {
    schemaName: "stepApproval",
    type: "multiple" as RelationDataType,
    optional: true,
    excludes: stepApproval_excludes,
    limit: 50,
    sort: {
      field: "_id",
      order: "desc" as RelationSortOrderType,
    },
    relatedRelations: {
      purchasingRequest: {
        type: "single" as RelationDataType,
        excludes: purchasingRequest_excludes,
      },
    },
  },
};

export const purchasingRequests = () =>
  coreApp.odm.newModel(
    "purchasingRequest",
    purchasingRequest_pure,
    purchasingRequest_relations,
    {
      createIndex: {
        indexSpec: {
          title: "text",
          description: "text",
        },
      },
    },
  );
