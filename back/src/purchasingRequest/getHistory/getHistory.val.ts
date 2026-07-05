import { enums, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const getHistoryValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      action: optional(enums([
        "created",
        "submitted",
        "step_approved",
        "step_rejected",
        "item_assigned",
        "item_conditions_changed",
        "item_removed",
        "goods_received",
        "payment_ordered",
        "goods_consumed",
      ])),
      performer: optional(string()),
      fromDate: optional(string()),
      toDate: optional(string()),
    }),
    get: object({}),
  });
};
