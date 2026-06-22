import { boolean, enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";
import { fiscalYear_status_emums } from "../../../models/fiscalYear.ts";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "name", "startDate", "endDate"])),
      sortOrder: optional(enums(["asc", "desc"])),
      name: optional(string()),
      status: optional(fiscalYear_status_emums),
      isActive: optional(boolean()),
    }),
    get: selectStruct("fiscalYear", 2),
  });
};
