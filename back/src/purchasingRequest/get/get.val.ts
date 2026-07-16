import { object, objectIdValidation } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const getValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
    }),
    get: selectStruct("purchasingRequest", {
      process: {
        organization: 1,
        createdBy: 1,
        unit: 1,
        ware: 1,
        wareModel: 1,
        wareGroup: 1,
        wareClass: 1,
        wareType: 1,
        steps: {
          approvals: {
            unit: {
              head: 1,
            },
            decidedBy: 1,
          },
        },
        requests: 1,
      },
      requester: 1,
      requestingUnit: 1,
      attachments: 1,
      budgetLine: 1,
      wareModel: 1,
      store: 1,
      ware: 1,
      wareType: 1,
      wareClass: 1,
      wareGroup: 1,
      stepApprovals: 1,
      purchaseOrderItems: 1,
      tender: 1,
      goodsReceipts: 1,
      paymentOrders: 1,
    }),
  });
};
