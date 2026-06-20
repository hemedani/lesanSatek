import { boolean, defaulted, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { unit_type_emums } from "@model";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      name: string(),
      enName: optional(string()),
      description: optional(string()),
      isActive: optional(defaulted(boolean(), true)),
      type: optional(unit_type_emums),
      address: optional(string()),
      phone: optional(string()),
      email: optional(string()),
      warehouseCapacity: optional(number()),
      hasColdStorage: optional(boolean()),
      fleetSize: optional(number()),
      serviceRadius: optional(number()),
      organizationId: optional(objectIdValidation),
      parentUnitId: optional(objectIdValidation),
      creatorId: optional(objectIdValidation),
      headId: optional(objectIdValidation),
    }),
    get: selectStruct("unit", 1),
  });
};
