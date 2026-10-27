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
import { accountingPeriod_status_enums } from "../../../models/accountingPeriod.ts";

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
          "code",
          "startDate",
          "endDate",
        ]),
      ),
      sortOrder: optional(enums(["asc", "desc"])),
      code: optional(string()),
      status: optional(accountingPeriod_status_enums),
      startDate: optional(coerce(date(), string(), (value) => new Date(value))),
      endDate: optional(coerce(date(), string(), (value) => new Date(value))),
    }),
    get: selectStruct("accountingPeriod", 2),
  });
