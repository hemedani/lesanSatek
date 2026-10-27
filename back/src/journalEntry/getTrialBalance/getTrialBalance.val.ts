import {
  coerce,
  date,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin } from "@lib";

export const getTrialBalanceValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: optional(objectIdValidation),
      periodId: optional(objectIdValidation),
      startDate: optional(coerce(date(), string(), (value) => new Date(value))),
      endDate: optional(coerce(date(), string(), (value) => new Date(value))),
    }),
    get: object({}),
  });
