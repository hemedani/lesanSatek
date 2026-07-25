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
      organization: { _id: 1, name: 1, enName: 1 },
      stuff: { _id: 1, quantity: 1, price: 1 },
      requester: { _id: 1, first_name: 1, last_name: 1 },
      requestingUnit: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
      budgetLine: {
        _id: 1, code: 1, title: 1, totalAllocated: 1, totalEncumbered: 1,
      },
      store: { _id: 1, name: 1, address: 1 },
      attachments: 1,
      ware: 1,
      wareType: 1,
      wareClass: 1,
      wareGroup: 1,
      history: 1,
      process: {
        _id: 1,
        name: 1,
        description: 1,
        steps: {
          _id: 1,
          name: 1,
          order: 1,
          description: 1,
          stepType: 1,
          required: 1,
          groupsOperator: 1,
          assigneeGroups: 1,
          approvals: {
            _id: 1,
            status: 1,
            comment: 1,
            decidedAt: 1,
            decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1, roles: 1 },
            unit: {
              _id: 1, name: 1,
              head: { _id: 1, first_name: 1, last_name: 1, position: 1, roles: 1 },
            },
          },
        },
      },
      stepApprovals: {
        _id: 1,
        status: 1,
        comment: 1,
        decidedAt: 1,
        processStep: { _id: 1, name: 1 },
        unit: { _id: 1, name: 1 },
        decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1, roles: { name: 1 } },
      },
      goodsReceipts: {
        _id: 1,
        receiptNumber: 1,
        items: 1,
        receivedAt: 1,
        status: 1,
        notes: 1,
      },
      paymentOrders: {
        _id: 1,
        title: 1,
        amount: 1,
        status: 1,
        paidAt: 1,
      },
      tenders: {
        _id: 1,
        title: 1,
        status: 1,
        deadline: 1,
        offers: {
          _id: 1,
          price: 1,
          deliveryTime: 1,
          paymentTerms: 1,
          status: 1,
          store: { _id: 1, name: 1 },
        },
      },
    }),
  });
};
