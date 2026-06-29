import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const assignStoreValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      assignedFromId: optional(objectIdValidation),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
