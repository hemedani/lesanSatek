import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";
import { tenderOffer_status_emums } from "../../../models/tenderOffer.ts";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "price", "submittedAt"])),
      sortOrder: optional(enums(["asc", "desc"])),
      tenderId: optional(string()),
      storeId: optional(string()),
      status: optional(tenderOffer_status_emums),
    }),
    get: selectStruct("tenderOffer", 2),
  });
};
