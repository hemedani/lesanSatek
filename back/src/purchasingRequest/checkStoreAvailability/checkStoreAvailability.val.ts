import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const checkStoreAvailabilityValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      purchasingRequestId: objectIdValidation,
      storeId: optional(objectIdValidation),
    }),
    get: selectStruct("stuff", 1),
  });
};
