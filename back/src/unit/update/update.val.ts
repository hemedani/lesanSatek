import { array, boolean, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { feature_enums, unit_type_emums } from "@model";

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
      features: optional(array(object({ feature: feature_enums }))),
      allowWareTypeIds: optional(array(string())),
      allowWareClassIds: optional(array(string())),
      allowWareGroupIds: optional(array(string())),
      allowWareModelIds: optional(array(string())),
      organizationId: optional(objectIdValidation),
    }),
    get: selectStruct("unit", 1),
  });
};
