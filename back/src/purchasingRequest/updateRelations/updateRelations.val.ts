import { array, enums, object, objectIdValidation, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateRelationsValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      requestingUnitId: optional(objectIdValidation),
      attachmentIds: optional(array(objectIdValidation)),
      tenderId: optional(string()),
      purchaseOrderItemIds: optional(array(objectIdValidation)),
      stepApprovalIds: optional(array(objectIdValidation)),
      goodsReceiptIds: optional(array(objectIdValidation)),
      paymentOrderIds: optional(array(objectIdValidation)),
      budgetLineId: optional(string()),
      storeId: optional(objectIdValidation),
      wareId: optional(objectIdValidation),
      wareTypeId: optional(objectIdValidation),
      wareClassId: optional(objectIdValidation),
      wareGroupId: optional(objectIdValidation),
    }),
    get: selectStruct("purchasingRequest", 2),
  });
};
