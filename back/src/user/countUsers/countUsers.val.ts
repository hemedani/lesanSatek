import { array, enums, object, optional } from "lesan";
import { role_emums } from "@model";
import { activeRoleMixin } from "@lib";

export const countUsersValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      roles: optional(array(role_emums)),
    }),
    get: object({
      qty: enums([0, 1]),
    }),
  });
};
