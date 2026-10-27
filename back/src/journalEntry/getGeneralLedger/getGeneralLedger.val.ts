import {
  coerce,
  date,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin } from "@lib";

export const getGeneralLedgerValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      accountId: objectIdValidation,
      periodId: optional(objectIdValidation),
      startDate: optional(coerce(date(), string(), (value) => new Date(value))),
      endDate: optional(coerce(date(), string(), (value) => new Date(value))),
    }),
    get: object({}),
  });
