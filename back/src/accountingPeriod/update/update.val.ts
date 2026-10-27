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

export const updateValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      name: optional(string()),
      startDate: optional(coerce(date(), string(), (value) => new Date(value))),
      endDate: optional(coerce(date(), string(), (value) => new Date(value))),
    }),
    get: selectStruct("accountingPeriod", 2),
  });
