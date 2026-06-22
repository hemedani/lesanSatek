import { enums, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      amount: number(),
      status: enums(["reserved", "spent", "released"]),
      referenceType: string(),
      referenceId: string(),
      description: optional(string()),
      budgetLineId: objectIdValidation,
      createdById: objectIdValidation,
    }),
    get: selectStruct("budgetEncumbrance", 2),
  });
};
