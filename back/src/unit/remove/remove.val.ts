import { boolean, enums, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";

export const removeValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      hardCascade: optional(boolean()),
      organizationId: optional(objectIdValidation),
    }),
    get: object({
      success: optional(enums([0, 1])),
    }),
  });
};
