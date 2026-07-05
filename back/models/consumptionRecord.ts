/**
 * ConsumptionRecord — Goods usage/consumption tracking.
 *
 * Records when inventory stock is consumed (used, dispensed, etc.). The `add`
 * custom action triggers inventoryManager.removeStock to decrement the relevant
 * inventory record. Includes optional patientId for healthcare contexts and
 * a reason/notes field for documentation.
 *
 * Pure fields: quantity, consumedAt, reason, patientId, notes
 * Relations: unit (Unit), consumedBy (User), inventory (Inventory, optional),
 *   wareModel (WareModel), ware (Ware, optional)
 *
 * @example
 * // A consumption record for using 2 TSH kits from the Hematology Lab inventory on a patient
 * {
 *   _id: ObjectId("cr_tsh_pat1"),
 *   quantity: 2,
 *   consumedAt: ISODate("2024-06-15T09:30:00Z"),
 *   reason: "استفاده برای آزمایش بیمار",
 *   patientId: "PAT-12345",
 *   notes: "کیت‌های شماره سریال KT-001 و KT-002 مصرف شدند",
 *   // Relations (populated via Lesan):
 *   // unit → { _id: ObjectId("unit_lab"), name: "آزمایشگاه هماتولوژی" }
 *   // consumedBy → { _id: ObjectId("user_ahmadi"), first_name: "Dr.", last_name: "Ahmadi" }
 *   // wareModel → { _id: ObjectId("wm_tsh"), name: "کیت TSH پیشرفته" }
 *   // ware → { _id: ObjectId("w_tsh_zist"), name: "کیت TSH پیشرفته ZistShimi" }
 *   // inventory → { _id: ObjectId("inv_tsh_lab"), quantity: 48 }
 *   //   (inv_tsh_lab is decremented from 50 to 48 by inventoryManager.removeStock)
 *   createdAt: ISODate("2024-06-15T09:30:00Z"),
 *   updatedAt: ISODate("2024-06-15T09:30:00Z")
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
import { inventory_excludes, unit_excludes, user_excludes, wareModel_excludes, ware_excludes } from "./excludes.ts";

export const consumptionRecord_pure = {
  quantity: number(),
  consumedAt: coerce(date(), string(), (value) => new Date(value)),
  reason: optional(string()),
  patientId: optional(string()),
  notes: optional(string()),
  ...createUpdateAt,
};

export const consumptionRecord_relations = {
  unit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: false,
    excludes: unit_excludes,
    relatedRelations: {
      consumptionRecords: {
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
      consumptionRecords: {
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
      consumptionRecords: {
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
      consumptionRecords: {
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
      consumptionRecords: {
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

export const consumptionRecords = () =>
  coreApp.odm.newModel("consumptionRecord", consumptionRecord_pure, consumptionRecord_relations);
