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
import { activeRoleMixin } from "@lib";
import { feature_enums, user_genders } from "@model";

export const addUserValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      first_name: string(),
      last_name: string(),
      gender: user_genders,
      birth_date: optional(string()),
      position: optional(string()),
      isActive: defaulted(boolean(), true),
      mobile: string(),
      email: string(),
      password: string(),
      is_verified: defaulted(boolean(), false),
      features: optional(array(object({ feature: feature_enums }))),
      allowWareTypeIds: optional(array(string())),
      allowWareClassIds: optional(array(string())),
      allowWareGroupIds: optional(array(string())),
      allowWareModelIds: optional(array(string())),
      avatar: optional(objectIdValidation),
      organizations: optional(array(objectIdValidation)),
      units: optional(array(objectIdValidation)),
      state: optional(objectIdValidation),
      city: optional(objectIdValidation),
    }),
    get: selectStruct("user", 1),
  });
};