import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "code", "title", "totalAllocated"])),
      sortOrder: optional(enums(["asc", "desc"])),
      code: optional(string()),
      title: optional(string()),
      fiscalYearId: optional(string()),
      organizationId: optional(string()),
      unitId: optional(string()),
    }),
    get: selectStruct("budgetLine", 2),
  });
};
