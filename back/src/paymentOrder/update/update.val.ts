import { object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";
import { paymentOrder_pure } from "@model";

export const updateValidator = () => {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...updatePure } = paymentOrder_pure;
  const optionalPure = Object.fromEntries(
    Object.entries(updatePure).map(([key, val]) => [key, optional(val as never)])
  );
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      ...optionalPure,
      purchasingRequestId: optional(objectIdValidation),
      payToId: optional(objectIdValidation),
      financialUnitId: optional(objectIdValidation),
    }),
    get: selectStruct("paymentOrder", 2),
  });
};
