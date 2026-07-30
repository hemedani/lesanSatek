import { coerce, date, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      wareId: objectIdValidation,
      quantity: number(),
      consumedAt: coerce(date(), string(), (value) => new Date(value)),
      reason: optional(string()),
      consumedFor: optional(string()),
      notes: optional(string()),
      unitId: optional(objectIdValidation),
      consumedById: optional(objectIdValidation),
      inventoryId: optional(objectIdValidation),
      purchasingRequestId: optional(objectIdValidation),
    }),
    get: selectStruct("consumption", 2),
  });
};
