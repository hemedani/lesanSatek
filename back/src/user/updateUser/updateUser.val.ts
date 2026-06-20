import {
  array,
  boolean,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";
import {
  role_emums,
  role_scope_type_emums,
  user_genders,
} from "@model";

export const updateUserValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      first_name: optional(string()),
      last_name: optional(string()),
      gender: optional(user_genders),
      birth_date: optional(string()),
      mobile: optional(string()),
      roles: optional(array(object({
        roleId: optional(string()),
        name: role_emums,
        scopeType: optional(role_scope_type_emums),
        scopeId: optional(string()),
      }))),
      email: optional(string()),
      password: optional(string()),
      is_verified: optional(boolean()),
      position: optional(string()),
      isActive: optional(boolean()),
    }),
    get: selectStruct("user", 1),
  });
};