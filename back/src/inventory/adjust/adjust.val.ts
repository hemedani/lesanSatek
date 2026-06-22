import { number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const adjustValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      quantity: number(),
      description: optional(string()),
    }),
    get: selectStruct("inventory", 2),
  });
};
