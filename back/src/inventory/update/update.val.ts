import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { inventory_pure } from "@model";

export const updateValidator = () => {
  const { createdAt, updatedAt, ...updatePure } = inventory_pure;
  const optionalPure = Object.fromEntries(
    Object.entries(updatePure).map(([key, val]) => [key, optional(val as any)])
  );
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      ...optionalPure,
      unitId: optional(objectIdValidation),
      warehouseUnitId: optional(objectIdValidation),
    }),
    get: selectStruct("inventory", 2),
  });
};
