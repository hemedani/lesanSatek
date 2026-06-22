import { array, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const updateRelationsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      purchasingRequestId: optional(objectIdValidation),
      createdById: optional(objectIdValidation),
      assignedVendors: optional(array(objectIdValidation)),
      offers: optional(array(objectIdValidation)),
    }),
    get: selectStruct("tender", 2),
  });
};
