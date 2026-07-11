import { enums, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { pagination, activeRoleMixin } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      search: optional(string()),
      sortBy: optional(enums(["createdAt", "updatedAt", "name", "order"])),
      sortOrder: optional(enums(["asc", "desc"])),
      processId: optional(objectIdValidation),
    }),
    get: selectStruct("processStep", 2),
  });
};
