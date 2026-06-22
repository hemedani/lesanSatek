import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { tender_pure } from "@model";

export const updateValidator = () => {
  const { createdAt, updatedAt, ...updatePure } = tender_pure;
  const optionalPure = Object.fromEntries(
    Object.entries(updatePure).map(([key, val]) => [key, optional(val as any)])
  );
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      ...optionalPure,
      purchasingRequestId: optional(objectIdValidation),
      createdById: optional(objectIdValidation),
    }),
    get: selectStruct("tender", 2),
  });
};
