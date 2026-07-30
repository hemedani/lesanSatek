import { enums, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { request_status_array } from "../../../models/purchasingRequest.ts";
import { paymentOrder_status_array } from "../../../models/paymentOrder.ts";
import { goodsReceipt_status_array } from "../../../models/goodsReceipt.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      search: optional(string()),
      status: optional(enums(request_status_array)),
      processId: optional(objectIdValidation),
      requesterId: optional(objectIdValidation),
      filterByAction: optional(enums([
        "created",
        "submitted",
        "step_approved",
        "step_rejected",
        "all_steps_approved",
        "finalized",
        "goods_received",
        "payment_ordered",
        "goods_consumed",
      ])),
      sortBy: optional(
        enums([
          "createdAt",
          "updatedAt",
          "title",
          "status",
          "amount",
          "currentStep",
          "requestedAt",
          "completedAt",
        ]),
      ),
      sortOrder: optional(enums(["asc", "desc"])),
      storeId: optional(objectIdValidation),
      wareId: optional(objectIdValidation),
      wareTypeId: optional(objectIdValidation),
      wareClassId: optional(objectIdValidation),
      wareGroupId: optional(objectIdValidation),
      unitId: optional(objectIdValidation),
      stuffStatus: optional(enums([
        "none", "assigned", "ready_to_ship", "shipped", "delivered", "received", "cancelled",
      ])),
      paymentOrderStatus: optional(enums(["none", ...paymentOrder_status_array])),
      goodsReceiptStatus: optional(enums(["none", ...goodsReceipt_status_array])),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
