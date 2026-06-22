import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { pagination } from "@lib";
import { paymentOrder_status_emums } from "../../../models/paymentOrder.ts";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      sortBy: optional(enums(["createdAt", "updatedAt", "_id", "title", "amount", "paidAt"])),
      sortOrder: optional(enums(["asc", "desc"])),
      purchasingRequestId: optional(string()),
      status: optional(paymentOrder_status_emums),
      financialUnitId: optional(string()),
    }),
    get: selectStruct("paymentOrder", 2),
  });
};
