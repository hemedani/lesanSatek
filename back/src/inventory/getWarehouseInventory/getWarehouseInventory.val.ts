import { enums, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

export const getWarehouseInventoryValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "quantity"])),
      sortOrder: optional(enums(["asc", "desc"])),
      search: optional(string()),
      wareModelId: optional(objectIdValidation),
      wareId: optional(objectIdValidation),
    }),
    get: selectStruct("inventory", 2),
  });
};
