import { boolean, coerce, date, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { fiscalYear_status_emums } from "../../../models/fiscalYear.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      name: string(),
      startDate: coerce(date(), string(), (value) => new Date(value)),
      endDate: coerce(date(), string(), (value) => new Date(value)),
      isActive: optional(boolean()),
      status: optional(fiscalYear_status_emums),
      organizationId: objectIdValidation,
    }),
    get: selectStruct("fiscalYear", 1),
  });
};
