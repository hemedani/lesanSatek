import { coerce, date, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      wareModelId: string(),
      wareModelName: string(),
      wareId: optional(string()),
      wareName: optional(string()),
      quantity: number(),
      consumedAt: coerce(date(), string(), (value) => new Date(value)),
      reason: optional(string()),
      patientId: optional(string()),
      notes: optional(string()),
      unitId: objectIdValidation,
      consumedById: objectIdValidation,
      inventoryId: optional(objectIdValidation),
      purchasingRequestId: optional(objectIdValidation),
    }),
    get: selectStruct("consumptionRecord", 2),
  });
};
