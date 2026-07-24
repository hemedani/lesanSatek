import { object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getPendingByUnitValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      search: optional(string()),
      unitId: optional(objectIdValidation),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
