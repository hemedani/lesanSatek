import {
  boolean,
  number,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import {
  account_normal_balance_enums,
  account_system_key_enums,
  account_type_enums,
} from "../../../models/account.ts";

export const addValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      code: string(),
      name: string(),
      enName: optional(string()),
      description: optional(string()),
      accountType: account_type_enums,
      normalBalance: account_normal_balance_enums,
      systemKey: optional(account_system_key_enums),
      level: optional(number()),
      isPostable: optional(boolean()),
      isActive: optional(boolean()),
      isSystem: optional(boolean()),
      organizationId: objectIdValidation,
      parentAccountId: optional(objectIdValidation),
    }),
    get: selectStruct("account", 1),
  });
