import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const updateRelationsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      purchasingRequestId: optional(objectIdValidation),
      assignedFromId: optional(objectIdValidation),
      assignedById: optional(objectIdValidation),
    }),
    get: selectStruct("purchaseOrderItem", 2),
  });
};
