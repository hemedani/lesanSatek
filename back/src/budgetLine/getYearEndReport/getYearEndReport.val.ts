import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";

export const getYearEndReportValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      fiscalYearId: objectIdValidation,
      organizationId: optional(objectIdValidation),
    }),
    get: object({}),
  });
};
