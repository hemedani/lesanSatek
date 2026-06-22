import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";
import { goodsReceipt_status_emums } from "../../../models/goodsReceipt.ts";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "receiptNumber", "receivedAt"])),
      sortOrder: optional(enums(["asc", "desc"])),
      purchasingRequestId: optional(string()),
      receivingUnitId: optional(string()),
      status: optional(goodsReceipt_status_emums),
    }),
    get: selectStruct("goodsReceipt", 2),
  });
};
