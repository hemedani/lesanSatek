import { object, objectIdValidation } from "lesan";
import { activeRoleMixin } from "@lib";
import { selectStruct } from "../../../mod.ts";

export const removeFromPurchaseValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      purchaseOrderItemId: objectIdValidation,
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
