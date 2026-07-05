import { array, coerce, defaulted, enums, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { po_item_status_array } from "../../../models/purchaseOrderItem.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      wareModelId: objectIdValidation,
      wareId: optional(objectIdValidation),
      quantity: number(),
      unitPrice: optional(number()),
      totalPrice: optional(number()),
      status: defaulted(
        coerce(
          enums(po_item_status_array),
          string(),
          (value) => value as typeof po_item_status_array[number],
        ),
        "pending",
      ),
      purchasingRequestId: objectIdValidation,
      assignedFromId: optional(objectIdValidation),
      assignedById: optional(objectIdValidation),
    }),
    get: selectStruct("purchaseOrderItem", 1),
  });
};
