/**
 * User — System user with role-based access control.
 *
 * Central authentication entity. Supports multi-role assignment (Manager, Admin,
 * OrgHead, UnitHead, Employee, Ordinary), feature-based permissions, and
 * warehouse classification access control (allowWareTypeIds, etc.).
 * The `isGhost` flag identifies the bootstrap superuser.
 * Passwords are excluded from API responses by default.
 *
 * Pure fields: first_name, last_name, gender, birth_date, mobile, email,
 *   password, is_verified, position, isActive, isGhost, features,
 *   allowWareTypeIds, allowWareClassIds, allowWareGroupIds, allowWareModelIds, roles
 * Relations: avatar (File), organization (Organization), units (Unit[])
 *
 * @example
 * // A Manager user (Ali Rezaei) — the Purchasing Manager at org_beheshti
 * // Belongs to Purchasing Dept and can register/approve purchase requests
 * // Also shows Dr. Ahmadi (Lab Head) as a second example
 * {
 *   _id: ObjectId("user_ali"),
 *   first_name: "Ali",
 *   last_name: "Rezaei",
 *   gender: "Male",
 *   birth_date: ISODate("1990-05-15"),
 *   mobile: "09121234567",
 *   email: "ali.rezaei@example.com",
 *   is_verified: true,
 *   position: "مدیر خرید",
 *   isActive: true,
 *   isGhost: false,
 *   features: [{ feature: "canRegisterPurchaseRequest" }, { feature: "canApprovePurchaseRequest" }, { feature: "canCreateTender" }],
 *   allowWareTypeIds: [ObjectId("wt_lab")],
 *   allowWareClassIds: [ObjectId("wc_hemato")],
 *   allowWareGroupIds: [ObjectId("wg_kit")],
 *   allowWareModelIds: [ObjectId("wm_tsh")],
 *   roles: [
 *     { roleId: "uuid-1", name: "Manager", scopeType: "organization", scopeId: ObjectId("org_beheshti") },
 *     { roleId: "uuid-2", name: "Ordinary" }
 *   ],
 *   // Relations (populated via Lesan):
 *   // avatar → { _id: ObjectId("file_avatar"), name: "ali_rezaei.jpg", type: "image" }
 *   // organization → { _id: ObjectId("org_beheshti"), name: "بیمارستان شهید بهشتی" }
 *   // units → [
 *   //   { _id: ObjectId("unit_purchasing"), name: "واحد خرید" },
 *   //   { _id: ObjectId("unit_warehouse"), name: "انبار مرکزی" }
 *   // ]
 *   createdAt: ISODate("2024-01-01T08:00:00Z"),
 *   updatedAt: ISODate("2024-06-01T12:00:00Z")
 * }
 * // ── Dr. Ahmadi, Head of Hematology Lab ──
 * // {
 * //   _id: ObjectId("user_ahmadi"),
 * //   first_name: "Dr.",
 * //   last_name: "Ahmadi",
 * //   position: "رئیس آزمایشگاه",
 * //   features: [{ feature: "canViewWarehouse" }, { feature: "canCreateConsumptionRecord" }],
 * //   roles: [{ roleId: "uuid-3", name: "UnitHead", scopeType: "unit", scopeId: ObjectId("unit_lab") }],
 * //   units: [{ _id: ObjectId("unit_lab") }]
 * // }
 */
import { coreApp } from "../mod.ts";
import {
  array,
  boolean,
  coerce,
  date,
  defaulted,
  enums,
  object,
  optional,
  pattern,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { city_excludes, file_excludes, organization_excludes, state_excludes, unit_excludes } from "./excludes.ts";
import { feature_enums } from "./featureConstants.ts";

export const role_array = [
  "Manager",
  "Admin",
  "OrgHead",
  "UnitHead",
  "Employee",
  "Ordinary",
];

export const role_emums = enums(role_array);

export const role_scope_type_emums = enums(["organization", "unit"]);

export const mobile_pattern = pattern(
  string(),
  /(\+98|0|98|0098)?([ ]|-|[()]){0,2}9[0-9]([ ]|-|[()]){0,2}(?:[0-9]([ ]|-|[()]){0,2}){8}/,
);

export const emailPattern = pattern(
  string(),
  /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
);

export const user_genders = coerce(
  enums(["Male", "Female"]),
  string(),
  (value) => value as "Male" | "Female",
);

export const user_pure = {
  first_name: string(),
  last_name: string(),
  gender: user_genders,
  birth_date: optional(coerce(date(), string(), (value) => new Date(value))),
  mobile: mobile_pattern,
  email: emailPattern,
  password: string(),
  is_verified: defaulted(boolean(), false),
  position: optional(string()),
  isActive: defaulted(boolean(), true),
  isGhost: defaulted(boolean(), false),
  features: defaulted(array(object({ feature: feature_enums })), []),
  allowWareTypeIds: optional(array(string())),
  allowWareClassIds: optional(array(string())),
  allowWareGroupIds: optional(array(string())),
  allowWareModelIds: optional(array(string())),
  roles: defaulted(
    array(object({
      roleId: string(),
      name: role_emums,
      scopeType: optional(role_scope_type_emums),
      scopeId: optional(string()),
    })),
    [{ roleId: crypto.randomUUID(), name: "Ordinary" }],
  ),
  ...createUpdateAt,
};

export const user_relations = {
  avatar: {
    schemaName: "file",
    type: "single" as RelationDataType,
    optional: true,
    excludes: file_excludes,
    relatedRelations: {},
  },
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: true,
    excludes: organization_excludes,
    relatedRelations: {
      users: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  state: {
    schemaName: "state",
    type: "single" as RelationDataType,
    optional: true,
    excludes: state_excludes,
    relatedRelations: {
      users: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  city: {
    schemaName: "city",
    type: "single" as RelationDataType,
    optional: true,
    excludes: city_excludes,
    relatedRelations: {
      users: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  units: {
    schemaName: "unit",
    type: "multiple" as RelationDataType,
    optional: true,
    excludes: unit_excludes,
    limit: 50,
    sort: {
      field: "_id",
      order: "desc" as RelationSortOrderType,
    },
    relatedRelations: {
      members: {
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

export const users = () =>
  coreApp.odm.newModel("user", user_pure, user_relations, {
    createIndex: {
      indexSpec: {
        email: 1,
      },
      options: { unique: true },
    },
    excludes: ["password"],
  });

export const createUserTextIndex = async () => {
  const collection = coreApp.odm.getCollection("user");
  try {
    await collection.createIndex({
      first_name: "text",
      last_name: "text",
      email: "text",
    });
  } catch (error) {
    console.log(
      "Text index already exists or creation failed:",
      (error as Error).message,
    );
  }
};
