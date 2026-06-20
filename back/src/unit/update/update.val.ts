import { boolean, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { unit_type_emums } from "@model";

export const updateValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      name: optional(string()),
      enName: optional(string()),
      description: optional(string()),
      isActive: optional(boolean()),
      type: optional(unit_type_emums),
      address: optional(string()),
      phone: optional(string()),
      email: optional(string()),
      warehouseCapacity: optional(number()),
      hasColdStorage: optional(boolean()),
      fleetSize: optional(number()),
      serviceRadius: optional(number()),
      organizationId: optional(objectIdValidation),
    }),
    get: selectStruct("unit", 1),
  });
};
