import { object, objectIdValidation } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const removeTenderSelectionValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
