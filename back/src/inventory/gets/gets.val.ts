import { enums, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "quantity"])),
      sortOrder: optional(enums(["asc", "desc"])),
      wareModelId: optional(objectIdValidation),
      unitId: optional(string()),
      warehouseUnitId: optional(string()),
    }),
    get: selectStruct("inventory", 2),
  });
};
