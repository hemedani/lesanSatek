import { coreApp } from "../mod.ts";
import {
  defaulted,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  fiscalYear_excludes,
  organization_excludes,
  unit_excludes,
  wareType_excludes,
} from "./excludes.ts";

export const budgetLine_pure = {
  code: string(),
  title: string(),
  description: optional(string()),
  totalAllocated: defaulted(number(), 0),
  totalEncumbered: defaulted(number(), 0),
  totalSpent: defaulted(number(), 0),
  remainingBudget: defaulted(number(), 0),
  ...createUpdateAt,
};

export const budgetLine_relations = {
  fiscalYear: {
    schemaName: "fiscalYear",
    type: "single" as RelationDataType,
    optional: false,
    excludes: fiscalYear_excludes,
    relatedRelations: {
      budgetLines: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  organization: {
    schemaName: "organization",
    type: "single" as RelationDataType,
    optional: false,
    excludes: organization_excludes,
    relatedRelations: {
      budgetLines: {
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
    optional: true,
    excludes: unit_excludes,
    relatedRelations: {
      budgetLines: {
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
      budgetLines: {
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

export const budgetLines = () =>
  coreApp.odm.newModel("budgetLine", budgetLine_pure, budgetLine_relations, {
    createIndex: {
      indexSpec: {
        code: "text",
        title: "text",
      },
    },
  });
