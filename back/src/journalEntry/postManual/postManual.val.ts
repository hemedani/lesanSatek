import {
  array,
  coerce,
  date,
  number,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { account_system_key_enums } from "../../../models/account.ts";

export const postManualValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: objectIdValidation,
      entryDate: optional(coerce(date(), string(), (value) => new Date(value))),
      description: optional(string()),
      reference: optional(string()),
      idempotencyKey: optional(string()),
      lines: array(
        object({
          accountId: optional(objectIdValidation),
          systemKey: optional(account_system_key_enums),
          description: optional(string()),
          debit: optional(number()),
          credit: optional(number()),
          costCenterId: optional(objectIdValidation),
          unitId: optional(objectIdValidation),
          storeId: optional(objectIdValidation),
        }),
      ),
    }),
    get: selectStruct("journalEntry", 2),
  });
