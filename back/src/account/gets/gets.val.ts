import {
  boolean,
  enums,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { activeRoleMixin, pagination } from "@lib";
import { selectStruct } from "../../../mod.ts";
import {
  account_system_key_enums,
  account_type_enums,
} from "../../../models/account.ts";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      organizationId: optional(objectIdValidation),
      ...pagination,
      sortBy: optional(
        enums(["createdAt", "updatedAt", "_id", "code", "name", "level"]),
      ),
      sortOrder: optional(enums(["asc", "desc"])),
      code: optional(string()),
      name: optional(string()),
      accountType: optional(account_type_enums),
      systemKey: optional(account_system_key_enums),
      isActive: optional(boolean()),
      parentAccountId: optional(objectIdValidation),
    }),
    get: selectStruct("account", 2),
  });
