import { enums, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";

export const getOrgChartValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      orgId: optional(objectIdValidation),
    }),
    get: object({
      units: optional(enums([0, 1])),
      organization: optional(enums([0, 1])),
    }),
  });
};
