import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "wareModelName", "quantity"])),
      sortOrder: optional(enums(["asc", "desc"])),
      wareModelId: optional(string()),
      unitId: optional(string()),
      warehouseUnitId: optional(string()),
    }),
    get: selectStruct("inventory", 2),
  });
};
