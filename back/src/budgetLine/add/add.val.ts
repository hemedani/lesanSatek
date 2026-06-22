import { number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      code: string(),
      title: string(),
      description: optional(string()),
      totalAllocated: optional(number()),
      totalEncumbered: optional(number()),
      totalSpent: optional(number()),
      remainingBudget: optional(number()),
      fiscalYearId: objectIdValidation,
      organizationId: objectIdValidation,
      unitId: optional(objectIdValidation),
      wareTypeId: optional(objectIdValidation),
    }),
    get: selectStruct("budgetLine", 1),
  });
};
