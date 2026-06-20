import { boolean, enums, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";

export const removeUserValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      hardCascade: optional(boolean()),
    }),
    get: object({
      success: optional(enums([0, 1])),
    }),
  });
};
