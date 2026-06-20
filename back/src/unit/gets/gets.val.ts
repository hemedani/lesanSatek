import { enums, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";
import { unit_type_emums } from "@model";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      search: optional(string()),
      sortBy: optional(
        enums(["createdAt", "updatedAt", "name", "enName", "isActive", "type"]),
      ),
      sortOrder: optional(enums(["asc", "desc"])),
      organizationId: optional(objectIdValidation),
      type: optional(unit_type_emums),
    }),
    get: selectStruct("unit", 2),
  });
};
