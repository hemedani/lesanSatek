import {
  array,
  boolean,
  defaulted,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { selectStruct } from "../../../mod.ts";
import {
  activeRoleMixin,
} from "@lib";
import {
  role_array,
  role_emums,
  role_scope_type_emums,
  user_genders,
} from "@model";

export const addUserValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      first_name: string(),
      last_name: string(),
      gender: user_genders,
      birth_date: optional(string()),
      roles: array(object({
        roleId: optional(string()),
        name: role_emums,
        scopeType: optional(role_scope_type_emums),
        scopeId: optional(string()),
      })),
      mobile: string(),
      email: string(),
      password: string(),
      is_verified: defaulted(boolean(), false),
      avatar: optional(objectIdValidation),
      organization: optional(objectIdValidation),
    }),
    get: selectStruct("user", 1),
  });
};