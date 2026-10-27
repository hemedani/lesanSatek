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

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: optional(objectIdValidation),
      ...pagination,
      sortBy: optional(
        enums([
          "createdAt",
          "updatedAt",
          "_id",
          "lineNumber",
          "debit",
          "credit",
        ]),
      ),
      sortOrder: optional(enums(["asc", "desc"])),
      journalEntryId: optional(objectIdValidation),
      accountId: optional(objectIdValidation),
      costCenterId: optional(objectIdValidation),
      storeId: optional(objectIdValidation),
      periodId: optional(objectIdValidation),
      startDate: optional(coerce(date(), string(), (value) => new Date(value))),
      endDate: optional(coerce(date(), string(), (value) => new Date(value))),
    }),
    get: selectStruct("journalEntryLine", 2),
  });
