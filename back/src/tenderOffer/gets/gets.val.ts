import { coerce, date, enums, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";
import { tenderOffer_status_emums } from "../../../models/tenderOffer.ts";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      search: optional(string()),
      tenderId: optional(string()),
      storeId: optional(string()),
      wareId: optional(objectIdValidation),
      status: optional(tenderOffer_status_emums),
      priceMin: optional(number()),
      priceMax: optional(number()),
      deliveryTimeMin: optional(number()),
      deliveryTimeMax: optional(number()),
      paymentTerms: optional(string()),
      submittedAtBefore: optional(coerce(date(), string(), (value) => new Date(value))),
      submittedAtAfter: optional(coerce(date(), string(), (value) => new Date(value))),
      sortBy: optional(enums([
        "createdAt", "updatedAt", "_id", "price", "deliveryTime", "submittedAt",
      ])),
      sortOrder: optional(enums(["asc", "desc"])),
    }),
    get: selectStruct("tenderOffer", 2),
  });
};
