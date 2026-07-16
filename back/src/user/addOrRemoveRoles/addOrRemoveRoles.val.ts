import { array, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";
import { role_emums, role_scope_type_emums } from "@model";

export const addOrRemoveRolesValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      addRoles: optional(array(object({
        roleId: optional(string()),
        name: role_emums,
        scopeType: optional(role_scope_type_emums),
        scopeId: optional(string()),
      }))),
      removeRoles: optional(array(object({
        roleId: optional(string()),
        name: role_emums,
        scopeType: optional(role_scope_type_emums),
        scopeId: optional(string()),
      }))),
    }),
    get: selectStruct("user", 2),
  });
};
