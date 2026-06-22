import { coerce, date, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      amount: number(),
      description: optional(string()),
      allocatedAt: coerce(date(), string(), (value) => new Date(value)),
      budgetLineId: objectIdValidation,
      allocatedById: objectIdValidation,
    }),
    get: selectStruct("budgetAllocation", 1),
  });
};
