/**
 * Store — Vendor/seller entity.
 *
 * Represents a supplier or vendor that sells wares. Contains comprehensive
 * business information: contact, location (city/state), bank details, certificates,
 * delivery settings, and status lifecycle (NotConfirmed → Confirmed → Suspension).
 * Stores can participate in tenders as assigned vendors and are linked to PurchaseOrderItems
 * Supported WareTypes are tracked via M:N relation.
 *
 * Pure fields: name, address, location, contact, logoUrl, ceoname, workingHours,
 *   cityDeliveryTime, stateDeliveryTime, selectedStateDeliveryTime, countryDeliveryTime,
 *   availableFastDeliveryTime, fastDelivery, isAvailableInHolidays, status,
 *   updateStatusDescription, score, totalSoldAmount, totalSoldNum, email, storeType,
 *   economicCode, postalCode, lastNewspaperUrl, certificateUrl, bankCardNumber,
 *   shebaNumber, nameOfAccountHolder, bankName, certificateNumber, registerNumber,
 *   certificateExpireDate, legalPerson, nationalId
 * Relations: storeHead (User), city (City), state (State), wareTypes (WareType[], M:N).
 * Note: store.purchaseOrderItems is auto-generated from purchaseOrderItem.assignedFrom.
 *
 * @example
 * // A confirmed medical equipment supplier (Salamat Co.) — lost the TSH tender to ZistShimi
 * // Supports Laboratory Equipment ware type
 * {
 *   _id: ObjectId("store_salamat"),
 *   name: "شرکت تجهیزات پزشکی سلامت",
 *   address: "تهران، خیابان ولیعصر، پلاک ۱۲۳",
 *   contact: "021-87654321",
 *   status: "Confirmed",
 *   score: 4.5,
 *   totalSoldAmount: 500000000,
 *   totalSoldNum: 120,
 *   storeType: "توزیع‌کننده",
 *   economicCode: "123456789",
 *   postalCode: "1234567890",
 *   shebaNumber: "IR123456789012345678901234",
 *   bankName: "ملی",
 *   fastDelivery: true,
 *   // Relations (populated via Lesan):
 *   // storeHead → { _id: ObjectId("..."), first_name: "Reza", last_name: "Mohammadi" }
 *   // city → { _id: ObjectId("..."), name: "تهران" }
 *   // state → { _id: ObjectId("..."), name: "تهران" }
 *   // wareTypes → [{ _id: ObjectId("wt_lab"), name: "تجهیزات آزمایشگاهی" }]
 *   createdAt: ISODate("2023-06-01T08:00:00Z"),
 *   updatedAt: ISODate("2024-05-20T09:00:00Z")
 * }
 * // ── ZistShimi Co. — the winning vendor for tender_tsh ──
 * // {
 * //   _id: ObjectId("store_zist"),
 * //   name: "شرکت زیست شیمی",
 * //   status: "Confirmed",
 * //   score: 4.8,
 * //   storeType: "تولیدکننده",
 * //   wareTypes: [{ _id: ObjectId("wt_lab") }]
 * // }
 */
import { coreApp } from "../mod.ts";
import {
  boolean,
  date,
  defaulted,
  number,
  optional,
  string,
  type RelationDataType,
  type RelationSortOrderType,
} from "lesan";
import { createUpdateAt } from "@lib";
import {
  user_excludes,
  city_excludes,
  state_excludes,
  wareType_excludes,
} from "./excludes.ts";

export const store_pure = {
  name: string(),
  address: optional(string()),
  location: optional(string()),
  contact: optional(string()),
  logoUrl: optional(string()),
  ceoname: optional(string()),
  workingHours: optional(string()),
  cityDeliveryTime: optional(string()),
  stateDeliveryTime: optional(string()),
  selectedStateDeliveryTime: optional(string()),
  countryDeliveryTime: optional(string()),
  availableFastDeliveryTime: optional(string()),
  fastDelivery: defaulted(boolean(), false),
  isAvailableInHolidays: defaulted(boolean(), false),
  status: defaulted(string(), "NotConfirmed"),
  updateStatusDescription: optional(string()),
  score: defaulted(number(), 0),
  totalSoldAmount: defaulted(number(), 0),
  totalSoldNum: defaulted(number(), 0),
  email: optional(string()),
  storeType: optional(string()),
  economicCode: optional(string()),
  postalCode: optional(string()),
  lastNewspaperUrl: optional(string()),
  certificateUrl: optional(string()),
  bankCardNumber: optional(string()),
  shebaNumber: optional(string()),
  nameOfAccountHolder: optional(string()),
  bankName: optional(string()),
  certificateNumber: optional(string()),
  registerNumber: optional(string()),
  certificateExpireDate: optional(date()),
  legalPerson: optional(string()),
  nationalId: optional(string()),
  ...createUpdateAt,
};

export const store_relations = {
  storeHead: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {},
  },
  city: {
    schemaName: "city",
    type: "single" as RelationDataType,
    optional: true,
    excludes: city_excludes,
    relatedRelations: {
      stores: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  state: {
    schemaName: "state",
    type: "single" as RelationDataType,
    optional: true,
    excludes: state_excludes,
    relatedRelations: {},
  },
  wareTypes: {
    schemaName: "wareType",
    type: "multiple" as RelationDataType,
    optional: true,
    limit: 50,
    excludes: wareType_excludes,
    sort: { field: "_id", order: "desc" as RelationSortOrderType },
    relatedRelations: {},
  },
};

export const stores = () =>
  coreApp.odm.newModel("store", store_pure, store_relations, {
    createIndex: {
      indexSpec: {
        name: "text",
      },
    },
  });
