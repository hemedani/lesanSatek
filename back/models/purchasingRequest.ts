/**
 * PurchasingRequest — Actual purchasing request flowing through a process.
 *
 * The core procurement document. Created as Draft, then submitted (Pending) to
 * begin the workflow. Each PR is for a single WareModel with a specific quantity.
 * The lifecycle: Draft → submit() → Pending → (step approvals) → InProgress →
 * Approved → (tender/award/PO) → goodsReceipt → Completed.
 * Also supports budget encumbrance auto-creation on submit and tender integration.
 *
 * Pure fields: title, description, estimatedAmount, quantity,
 *   status, currentStep, requestedAt, completedAt,
 *   history[{action, performed{by, name, at, role{id, name, scopeType?, scopeId?}}, unit{_id, name}?, details{...}}]
 * Relations: wareModel (WareModel), process (Process), requester (User),
 *   requestingUnit (Unit), attachments (File[]), stepApprovals (StepApproval[]),
 *   purchaseOrderItems (PurchaseOrderItem[]), tender (Tender),
 *   budgetLine (BudgetLine), store (Store), ware (Ware),
 *   wareType (WareType), wareClass (WareClass), wareGroup (WareGroup)
 *
 * @example
 * // A submitted request for 100 TSH kits, flowing through proc_lab
 * // Currently at step 2 (Review by Warehouse), with a tender awarded
 * {
 *   _id: ObjectId("pr_tsh"),
 *   title: "خرید کیت TSH",
 *   description: "کیت آزمایشگاهی TSH برای آزمایشگاه هماتولوژی",
 *   estimatedAmount: 25000000,
 *   quantity: 100,
 *   status: "InProgress",
 *   currentStep: 2,
 *   requestedAt: ISODate("2024-06-01T08:00:00Z"),
 *   completedAt: null,
 *   history: [
 *     { action: "submitted",
 *       performed: { by: "user_ali", name: "علی رضایی", at: ISODate("..."),
 *         role: { id: "uuid-1", name: "Manager", scopeType: "organization", scopeId: "org_beheshti" } },
 *       details: {} }
 *   ],
 *   // Relations (populated via Lesan):
 *   // wareModel → { _id: ObjectId("wm_tsh"), name: "کیت TSH پیشرفته" }
 *   // process → { _id: ObjectId("proc_lab"), name: "فرآیند خرید تجهیزات پزشکی" }
 *   // requester → { _id: ObjectId("user_ali"), first_name: "Ali", last_name: "Rezaei" }
 *   // requestingUnit → { _id: ObjectId("unit_lab"), name: "آزمایشگاه هماتولوژی" }
 *   // stepApprovals → [ ... ]
 *   // purchaseOrderItems → [{ _id: ObjectId("poi_tsh"), status: "assigned" }]
 *   // tender → { _id: ObjectId("tender_tsh"), title: "مناقصه کیت TSH", status: "awarded" }
 *   createdAt: ISODate("2024-06-01T08:00:00Z"),
 *   updatedAt: ISODate("2024-06-20T09:00:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
  array,
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
  budgetLine_excludes,
  process_excludes,
  user_excludes,
  unit_excludes,
  file_excludes,
  stepApproval_excludes,
  purchaseOrderItem_excludes,
  purchasingRequest_excludes,
  tender_excludes,
  wareModel_excludes,
  store_excludes,
  ware_excludes,
  wareType_excludes,
  wareClass_excludes,
  wareGroup_excludes,
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
  estimatedAmount: optional(number()),
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
  quantity: number(),
  history: defaulted(
    array(object({
      action: string(),
      performed: object({
        by: string(),
        name: string(),
        at: coerce(date(), string(), (value) => new Date(value)),
        role: object({
          id: string(),
          name: string(),
          scopeType: optional(string()),
          scopeId: optional(string()),
        }),
      }),
      unit: optional(object({
        _id: string(),
        name: string(),
      })),
      details: optional(object({})),
    })),
    [],
  ),
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
  purchaseOrderItems: {
    schemaName: "purchaseOrderItem",
    type: "multiple" as RelationDataType,
    optional: true,
    excludes: purchaseOrderItem_excludes,
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
  tender: {
    schemaName: "tender",
    type: "single" as RelationDataType,
    optional: true,
    excludes: tender_excludes,
    relatedRelations: {
      purchasingRequest: {
        type: "single" as RelationDataType,
        excludes: purchasingRequest_excludes,
      },
    },
  },
  budgetLine: {
    schemaName: "budgetLine",
    type: "single" as RelationDataType,
    optional: true,
    excludes: budgetLine_excludes,
    relatedRelations: {
      purchasingRequests: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  wareModel: {
    schemaName: "wareModel",
    type: "single" as RelationDataType,
    optional: false,
    excludes: wareModel_excludes,
    relatedRelations: {
      purchasingRequests: {
        type: "multiple" as RelationDataType,
        limit: 50,
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
      purchasingRequests: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  ware: {
    schemaName: "ware",
    type: "single" as RelationDataType,
    optional: true,
    excludes: ware_excludes,
    relatedRelations: {
      purchasingRequests: {
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
      purchasingRequests: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  wareClass: {
    schemaName: "wareClass",
    type: "single" as RelationDataType,
    optional: true,
    excludes: wareClass_excludes,
    relatedRelations: {
      purchasingRequests: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  wareGroup: {
    schemaName: "wareGroup",
    type: "single" as RelationDataType,
    optional: true,
    excludes: wareGroup_excludes,
    relatedRelations: {
      purchasingRequests: {
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
