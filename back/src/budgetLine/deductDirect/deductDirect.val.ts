import { number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const deductDirectValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      amount: number(),
      description: optional(string()),
    }),
    get: selectStruct("budgetLine", 1),
  });
};
