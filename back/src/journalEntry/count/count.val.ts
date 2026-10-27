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
import {
  journalEntry_source_type_enums,
  journalEntry_status_enums,
} from "../../../models/journalEntry.ts";

export const countValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: optional(objectIdValidation),
      entryNumber: optional(string()),
      sourceType: optional(journalEntry_source_type_enums),
      status: optional(journalEntry_status_enums),
      periodId: optional(objectIdValidation),
      startDate: optional(coerce(date(), string(), (value) => new Date(value))),
      endDate: optional(coerce(date(), string(), (value) => new Date(value))),
    }),
    get: object({ count: optional(number()) }),
  });
