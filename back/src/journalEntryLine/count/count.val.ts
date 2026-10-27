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

export const countValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: optional(objectIdValidation),
      journalEntryId: optional(objectIdValidation),
      accountId: optional(objectIdValidation),
      costCenterId: optional(objectIdValidation),
      storeId: optional(objectIdValidation),
      periodId: optional(objectIdValidation),
      startDate: optional(coerce(date(), string(), (value) => new Date(value))),
      endDate: optional(coerce(date(), string(), (value) => new Date(value))),
    }),
    get: object({ count: optional(number()) }),
  });
