/**
 * Unit — Hierarchical organizational unit (infinite tree).
 *
 * Represents departments, warehouses, logistics teams, and other sub-units
 * within an organization. Supports infinite nesting via parentUnit/subUnits.
 * The `type` discriminator (General|Warehouse|Logistics|Production|Administration|Expert)
 * drives which features/actions are available. Each unit has an optional head (User),
 * feature flags, and warehouse classification access controls.
 * `organization` is denormalized on every unit for query efficiency.
 *
 * Pure fields: name, enName, description, isActive, type, address, phone, email,
 *   warehouseCapacity, hasColdStorage, fleetSize, serviceRadius, features,
 *   allowWareTypeIds, allowWareClassIds, allowWareGroupIds, allowWareModelIds
 * Relations: organization (Organization), parentUnit (Unit), creator (User), head (User)
 *
 * @example
 * // A warehouse unit nested under the hospital organization, created by Ali, headed by Dr. Ahmadi
 * // Also demonstrates a child unit (Hematology Lab) via parentUnit
 * {
 *   _id: ObjectId("unit_warehouse"),
 *   name: "انبار مرکزی",
 *   enName: "Central Warehouse",
 *   description: "انبار اصلی تجهیزات پزشکی",
 *   isActive: true,
 *   type: "Warehouse",
 *   address: "طبقه همکف، بخش شمالی",
 *   phone: "021-12345678",
 *   email: "warehouse@hospital.com",
 *   warehouseCapacity: 5000,
 *   hasColdStorage: true,
 *   fleetSize: 3,
 *   serviceRadius: 50,
 *   features: [{ feature: "canViewWarehouse" }, { feature: "canManageUnitInventory" }],
 *   // Relations (populated via Lesan): organization → org_beheshti
 *   // parentUnit → null (top-level unit)
 *   // creator → { _id: ObjectId("user_ali"), first_name: "Ali", last_name: "Rezaei" }
 *   // head → { _id: ObjectId("user_ahmadi"), first_name: "Dr.", last_name: "Ahmadi" }
 *   createdAt: ISODate("2023-06-15T08:00:00Z"),
 *   updatedAt: ISODate("2024-02-20T14:00:00Z")
 * }
 * // ── A child unit (lab) nested under the warehouse above ──
 * // {
 * //   _id: ObjectId("unit_lab"),
 * //   name: "آزمایشگاه هماتولوژی",
 * //   enName: "Hematology Lab",
 * //   type: "Expert",
 * //   organization: { _id: ObjectId("org_beheshti") },
 * //   parentUnit: { _id: ObjectId("unit_warehouse") },
 * //   head: { _id: ObjectId("user_ahmadi") },
 * // }
 */
import { coreApp } from "../mod.ts";
import {
  array,
  boolean,
  coerce,
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
  organization_excludes,
  user_excludes,
  unit_excludes,
} from "./excludes.ts";
import { feature_enums } from "./featureConstants.ts";

export const unit_type_array = ["General", "Warehouse", "Logistics", "Production", "Administration", "Expert"];
export const unit_type_emums = enums(unit_type_array);

export const unit_pure = {
  name: string(),
  enName: optional(string()),
  description: optional(string()),
  isActive: defaulted(boolean(), true),
  type: defaulted(
    coerce(
      unit_type_emums,
      string(),
      (value) => value as typeof unit_type_array[number],
    ),
    "General",
  ),
  address: optional(string()),
  phone: optional(string()),
  email: optional(string()),
  warehouseCapacity: optional(number()),
  hasColdStorage: optional(boolean()),
  fleetSize: optional(number()),
  serviceRadius: optional(number()),
  features: defaulted(array(object({ feature: feature_enums })), []),
  allowWareTypeIds: optional(array(string())),
  allowWareClassIds: optional(array(string())),
  allowWareGroupIds: optional(array(string())),
  allowWareModelIds: optional(array(string())),
  ...createUpdateAt,
};

export const unit_relations = {
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: true,
    excludes: organization_excludes,
    relatedRelations: {
      units: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  parentUnit: {
    schemaName: "unit",
    type: "single" as RelationDataType,
    optional: true,
    excludes: unit_excludes,
    relatedRelations: {
      subUnits: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  creator: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      createdUnits: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  head: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      headedUnit: {
        type: "single" as RelationDataType,
        excludes: unit_excludes,
      },
    },
  },
};

export const units = () =>
  coreApp.odm.newModel("unit", unit_pure, unit_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
        enName: "text",
        description: "text",
      },
    },
  });
