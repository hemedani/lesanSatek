import {
  boolean,
  number,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin } from "@lib";
import {
  account_system_key_enums,
  account_type_enums,
} from "../../../models/account.ts";

export const countValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: optional(objectIdValidation),
      code: optional(string()),
      name: optional(string()),
      accountType: optional(account_type_enums),
      systemKey: optional(account_system_key_enums),
      isActive: optional(boolean()),
      parentAccountId: optional(objectIdValidation),
    }),
    get: object({ count: optional(number()) }),
  });
