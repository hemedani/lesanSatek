import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "quantity", "consumedAt", "wareModelName"])),
      sortOrder: optional(enums(["asc", "desc"])),
      unitId: optional(string()),
      wareModelId: optional(string()),
      reason: optional(string()),
      patientId: optional(string()),
    }),
    get: selectStruct("consumptionRecord", 2),
  });
};
