import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id"])),
      sortOrder: optional(enums(["asc", "desc"])),
      purchasingRequestId: optional(string()),
      status: optional(string()),
      wareModelId: optional(string()),
    }),
    get: selectStruct("purchaseOrderItem", 2),
  });
};
