import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "amount", "allocatedAt"])),
      sortOrder: optional(enums(["asc", "desc"])),
      budgetLineId: optional(string()),
    }),
    get: selectStruct("budgetAllocation", 2),
  });
};
