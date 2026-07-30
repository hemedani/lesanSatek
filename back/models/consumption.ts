/**
 * Consumption — Goods usage/consumption tracking.
 *
 * Records when inventory stock is consumed (used, dispensed, etc.). The `add`
 * custom action triggers inventoryManager.removeStock to decrement the relevant
 * inventory record. Includes optional consumedFor (person full name) and
 * a reason/notes field for documentation.
 *
 * Hierarchy relations (wareType, wareClass, wareGroup, wareModel) are auto-derived
 * from the ware and stored for efficient querying/stats.
 *
 * Pure fields: quantity, consumedAt, reason, consumedFor, notes
 * Relations: unit (Unit), consumedBy (User), inventory (Inventory, optional),
 *   ware (Ware, optional), wareModel (WareModel, optional),
 *   wareGroup (WareGroup, optional), wareClass (WareClass, optional),
 *   wareType (WareType, optional)
 *
 * @example
 * // A consumption record for using 2 units of a specific Ware
 * {
 *   _id: ObjectId("cr_tsh_pat1"),
 *   quantity: 2,
 *   consumedAt: ISODate("2024-06-15T09:30:00Z"),
 *   reason: "استفاده برای آزمایش بیمار",
 *   consumedFor: "علی محمدی",
 *   notes: "کیت‌های شماره سریال KT-001 و KT-002 مصرف شدند",
 *   // Relations (populated via Lesan):
 *   // unit → { _id: ObjectId("unit_lab") }
 *   // consumedBy → { _id: ObjectId("user_ahmadi") }
 *   // inventory → { _id: ObjectId("inv_tsh_lab") }
 *   // ware → { _id: ObjectId("w_tsh_zist") }
 *   // wareModel → { _id: ObjectId("wm_tsh") }
 *   // wareGroup → { _id: ObjectId("wg_kit") }
 *   // wareClass → { _id: ObjectId("wc_hemato") }
 *   // wareType → { _id: ObjectId("wt_lab") }
 * }
 */
import { coreApp } from "../mod.ts";
import {
  coerce,
  date,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { inventory_excludes, unit_excludes, user_excludes, wareModel_excludes, ware_excludes, wareType_excludes, wareClass_excludes, wareGroup_excludes } from "./excludes.ts";

export const consumption_pure = {
  quantity: number(),
  consumedAt: coerce(date(), string(), (value) => new Date(value)),
  reason: optional(string()),
  consumedFor: optional(string()),
  notes: optional(string()),
  ...createUpdateAt,
};

export const consumption_relations = {
  unit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: false,
    excludes: unit_excludes,
    relatedRelations: {
      consumptions: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  consumedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      consumptions: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  inventory: {
    schemaName: "inventory",
    type: "single" as RelationDataType,
    optional: true,
    excludes: inventory_excludes,
    relatedRelations: {
      consumptions: {
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
      consumptions: {
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
    optional: true,
    excludes: wareModel_excludes,
    relatedRelations: {
      consumptions: {
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
      consumptions: {
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
      consumptions: {
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
      consumptions: {
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

export const consumptions = () =>
  coreApp.odm.newModel("consumption", consumption_pure, consumption_relations);
