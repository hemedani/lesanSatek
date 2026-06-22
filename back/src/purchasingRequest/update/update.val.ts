import { array, coerce, defaulted, enums, number, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { request_status_emums } from "../../../models/purchasingRequest.ts";
import { po_item_status_array } from "../../../models/purchaseOrderItem.ts";
import { activeRoleMixin } from "@lib";

export const updateValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      title: optional(string()),
      description: optional(string()),
      amount: optional(number()),
      status: optional(request_status_emums),
      currentStep: optional(number()),
      requestedAt: optional(string()),
      completedAt: optional(string()),
      items: optional(array(object({
        wareModelId: string(),
        wareModelName: string(),
        wareId: optional(string()),
        wareName: optional(string()),
        quantity: number(),
        unitPrice: optional(number()),
        status: defaulted(
          coerce(
            enums(po_item_status_array),
            string(),
            (value) => value as typeof po_item_status_array[number],
          ),
          "pending",
        ),
      }))),
      organizationId: optional(objectIdValidation),
    }),
    get: selectStruct("purchasingRequest", 1),
  });
};
