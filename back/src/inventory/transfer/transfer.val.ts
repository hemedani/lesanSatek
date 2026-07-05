import { number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

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
    get: selectStruct("inventory", 2),
  });
};
