import { object, objectIdValidation } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const addStuffValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      stuffId: objectIdValidation,
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
