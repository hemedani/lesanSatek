import { coerce, date, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { tenderOffer_status_emums } from "../../../models/tenderOffer.ts";

export const submitValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      price: number(),
      deliveryTime: number(),
      paymentTerms: optional(string()),
      description: optional(string()),
      status: optional(tenderOffer_status_emums),
      submittedAt: coerce(date(), string(), (value) => new Date(value)),
      tenderId: objectIdValidation,
      storeId: objectIdValidation,
    }),
    get: selectStruct("tenderOffer", 1),
  });
};
