import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const countValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      fiscalYearId: optional(string()),
      organizationId: optional(string()),
      unitId: optional(string()),
    }),
    get: object({ qty: optional(enums([0, 1])) }),
  });
};
