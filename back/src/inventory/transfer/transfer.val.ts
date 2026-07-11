import { number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const transferValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      fromUnitId: objectIdValidation,
      toUnitId: objectIdValidation,
      wareModelId: objectIdValidation,
      quantity: number(),
      description: optional(string()),
    }),
    get: object({
      fromUnit: optional(object({ _id: optional(number()) })),
      toUnit: optional(object({ _id: optional(number()) })),
      quantity: optional(number()),
    }),
  });
};
