import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";
import { stockMovement_reason_emums } from "../../../models/stockMovement.ts";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "quantity", "reason"])),
      sortOrder: optional(enums(["asc", "desc"])),
      unitId: optional(string()),
      wareModelId: optional(string()),
      reason: optional(stockMovement_reason_emums),
      referenceType: optional(string()),
      referenceId: optional(string()),
    }),
    get: selectStruct("stockMovement", 2),
  });
};
