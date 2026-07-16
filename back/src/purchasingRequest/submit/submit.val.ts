import { object, objectIdValidation, optional } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const submitValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      storeId: optional(objectIdValidation),
      requestingUnitId: optional(objectIdValidation),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
