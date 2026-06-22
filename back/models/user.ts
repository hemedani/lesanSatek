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
import { file_excludes, organization_excludes, unit_excludes } from "./excludes.ts";
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
