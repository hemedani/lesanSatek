/**
 * Organization — Top-level organizational entity.
 *
 * Represents an organization that owns purchasing processes, units, users,
 * and budget lines. Each organization can have a creator, a head, and a logo.
 * All units are denormalized with their organization ID for query efficiency.
 *
 * Pure fields: name, enName, description, isActive
 * Relations: logo (File), creator (User), head (User)
 *
 * @example
 * // A hospital organization, created by Ali Rezaei, with a logo file
 * {
 *   _id: ObjectId("org_beheshti"),
 *   name: "بیمارستان شهید بهشتی",
 *   enName: "Shahid Beheshti Hospital",
 *   description: "بیمارستان تخصصی و فوق تخصصی",
 *   isActive: true,
 *   // Relations (populated via Lesan): logo → file, creator → user, head → user
 *   // logo: { _id: ObjectId("file_logo"), name: "beheshti_logo.png" }
 *   // creator: { _id: ObjectId("user_ali"), first_name: "Ali", last_name: "Rezaei" }
 *   // head: { _id: ObjectId("user_ahmadi"), first_name: "Dr.", last_name: "Ahmadi" }
 *   createdAt: ISODate("2023-06-01T08:00:00Z"),
 *   updatedAt: ISODate("2024-03-15T10:30:00Z")
 * }
 */
import { coreApp } from "../mod.ts";
import {
  boolean,
  defaulted,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import { city_excludes, file_excludes, state_excludes, user_excludes } from "./excludes.ts";

export const organization_pure = {
  name: string(),
  enName: optional(string()),
  description: optional(string()),
  isActive: defaulted(boolean(), true),
  ...createUpdateAt,
};

export const organization_relations = {
  logo: {
    schemaName: "file",
    type: "single" as RelationDataType,
    optional: true,
    excludes: file_excludes,
    relatedRelations: {},
  },
  creator: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      createdOrganizations: {
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
      headedOrganization: {
        type: "single" as RelationDataType,
        excludes: ["createdAt", "updatedAt"],
      },
    },
  },
  state: {
    schemaName: "state",
    type: "single" as RelationDataType,
    optional: true,
    excludes: state_excludes,
    relatedRelations: {
      organizations: {
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
      organizations: {
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

export const organizations = () =>
  coreApp.odm.newModel(
    "organization",
    organization_pure,
    organization_relations,
    {
      createIndex: {
        indexSpec: {
          name: "text",
          enName: "text",
          description: "text",
        },
      },
    },
  );
