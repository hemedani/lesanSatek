import {
  coerce,
  date,
  number,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin } from "@lib";
import { accountingPeriod_status_enums } from "../../../models/accountingPeriod.ts";

export const countValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: optional(objectIdValidation),
      code: optional(string()),
      status: optional(accountingPeriod_status_enums),
      startDate: optional(coerce(date(), string(), (value) => new Date(value))),
      endDate: optional(coerce(date(), string(), (value) => new Date(value))),
    }),
    get: object({ count: optional(number()) }),
  });
