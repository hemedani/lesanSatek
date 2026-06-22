import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { budgetLine_pure } from "@model";

export const updateValidator = () => {
  const { createdAt, updatedAt, ...updatePure } = budgetLine_pure;
  const optionalPure = Object.fromEntries(
    Object.entries(updatePure).map(([key, val]) => [key, optional(val as any)])
  );
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      ...optionalPure,
      fiscalYearId: optional(objectIdValidation),
      organizationId: optional(objectIdValidation),
      unitId: optional(objectIdValidation),
      wareTypeId: optional(objectIdValidation),
    }),
    get: selectStruct("budgetLine", 2),
  });
};
