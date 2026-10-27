import {
  coerce,
  date,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { accountingPeriod_status_enums } from "../../../models/accountingPeriod.ts";

export const addValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      code: string(),
      name: string(),
      startDate: coerce(date(), string(), (value) => new Date(value)),
      endDate: coerce(date(), string(), (value) => new Date(value)),
      status: optional(accountingPeriod_status_enums),
      organizationId: objectIdValidation,
      fiscalYearId: optional(objectIdValidation),
    }),
    get: selectStruct("accountingPeriod", 1),
  });
