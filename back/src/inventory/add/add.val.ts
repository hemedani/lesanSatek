import { coerce, date, defaulted, number, object, objectIdValidation, optional, string } from "lesan";
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
      quantity: defaulted(number(), 0),
      minQuantity: optional(number()),
      maxQuantity: optional(number()),
      batchNo: optional(string()),
      expirationDate: optional(coerce(date(), string(), (value) => new Date(value))),
      location: optional(string()),
      lastCountedAt: optional(coerce(date(), string(), (value) => new Date(value))),
      unitId: objectIdValidation,
      warehouseUnitId: optional(objectIdValidation),
    }),
    get: selectStruct("inventory", 1),
  });
};
