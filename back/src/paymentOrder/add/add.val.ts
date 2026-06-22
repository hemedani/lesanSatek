import { coerce, date, number, object, objectIdValidation, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { paymentOrder_status_emums } from "../../../models/paymentOrder.ts";

export const addValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      title: string(),
      amount: number(),
      description: optional(string()),
      status: optional(paymentOrder_status_emums),
      paidAt: optional(coerce(date(), string(), (value) => new Date(value))),
      purchasingRequestId: objectIdValidation,
      issuedById: objectIdValidation,
      approvedById: optional(objectIdValidation),
      payToId: objectIdValidation,
      financialUnitId: objectIdValidation,
    }),
    get: selectStruct("paymentOrder", 1),
  });
};
