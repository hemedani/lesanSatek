import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";
import { tender_status_emums } from "../../../models/tender.ts";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "title", "deadline"])),
      sortOrder: optional(enums(["asc", "desc"])),
      title: optional(string()),
      status: optional(tender_status_emums),
      purchasingRequestId: optional(string()),
    }),
    get: selectStruct("tender", 2),
  });
};
