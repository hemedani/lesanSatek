import {
  coerce,
  date,
  enums,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin, pagination } from "@lib";
import { selectStruct } from "../../../mod.ts";
import {
  journalEntry_source_type_enums,
  journalEntry_status_enums,
} from "../../../models/journalEntry.ts";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: optional(objectIdValidation),
      ...pagination,
      sortBy: optional(
        enums(["createdAt", "updatedAt", "_id", "entryNumber", "entryDate"]),
      ),
      sortOrder: optional(enums(["asc", "desc"])),
      entryNumber: optional(string()),
      sourceType: optional(journalEntry_source_type_enums),
      status: optional(journalEntry_status_enums),
      periodId: optional(objectIdValidation),
      startDate: optional(coerce(date(), string(), (value) => new Date(value))),
      endDate: optional(coerce(date(), string(), (value) => new Date(value))),
    }),
    get: selectStruct("journalEntry", 2),
  });
