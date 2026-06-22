import { array, coerce, date, defaulted, enums, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { goodsReceipt_status_emums } from "../../../models/goodsReceipt.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      receiptNumber: string(),
      description: optional(string()),
      receivedAt: coerce(date(), string(), (value) => new Date(value)),
      status: optional(goodsReceipt_status_emums),
      notes: optional(string()),
      items: defaulted(
        array(object({
          purchaseOrderItemId: string(),
          wareModelId: string(),
          quantityReceived: number(),
          quantityAccepted: number(),
          quantityRejected: number(),
          batchNo: optional(string()),
          expirationDate: optional(coerce(date(), string(), (value) => new Date(value))),
        })),
        [],
      ),
      purchasingRequestId: objectIdValidation,
      receivedById: objectIdValidation,
      receivingUnitId: objectIdValidation,
    }),
    get: selectStruct("goodsReceipt", 1),
  });
};
