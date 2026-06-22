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
import { createUpdateAt } from "@lib";
import {
  purchasingRequest_excludes,
  user_excludes,
  store_excludes,
} from "./excludes.ts";

export const tender_status_array = ["open", "closed", "awarded", "cancelled"];
export const tender_status_emums = enums(tender_status_array);

export const tender_pure = {
  title: string(),
  description: optional(string()),
  status: defaulted(
    coerce(
      tender_status_emums,
      string(),
      (value) => value as typeof tender_status_array[number],
    ),
    "open",
  ),
  deadline: coerce(date(), string(), (value) => new Date(value)),
  ...createUpdateAt,
};

export const tender_relations = {
  purchasingRequest: {
    schemaName: "purchasingRequest",
    type: "single" as RelationDataType,
    optional: false,
    excludes: purchasingRequest_excludes,
    relatedRelations: {
      tender: {
        type: "single" as RelationDataType,
        excludes: purchasingRequest_excludes,
      },
    },
  },
  createdBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      createdTenders: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  assignedVendors: {
    schemaName: "store",
    type: "multiple" as RelationDataType,
    optional: true,
    excludes: store_excludes,
    limit: 50,
    sort: {
      field: "_id",
      order: "desc" as RelationSortOrderType,
    },
    relatedRelations: {
      tenders: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
  offers: {
    schemaName: "tenderOffer",
    type: "multiple" as RelationDataType,
    optional: true,
    excludes: [],
    limit: 50,
    sort: {
      field: "_id",
      order: "desc" as RelationSortOrderType,
    },
    relatedRelations: {
      tender: {
        type: "single" as RelationDataType,
        excludes: [],
      },
    },
  },
};

export const tenders = () =>
  coreApp.odm.newModel("tender", tender_pure, tender_relations, {
    createIndex: {
      indexSpec: {
        title: "text",
        description: "text",
      },
    },
  });
