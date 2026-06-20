import { boolean, enums, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { unit_type_emums } from "@model";

export const countValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      name: optional(string()),
      isActive: optional(boolean()),
      organizationId: optional(objectIdValidation),
      type: optional(unit_type_emums),
    }),
    get: object({ qty: optional(enums([0, 1])) }),
  });
};
