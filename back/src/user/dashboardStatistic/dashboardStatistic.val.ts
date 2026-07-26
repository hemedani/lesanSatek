import { enums, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";

export const dashboardStatisticValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      type: enums(["unitHead"]),
      unitId: optional(objectIdValidation),
      orgId: optional(objectIdValidation),
    }),
    get: object({
      unit: optional(enums([0, 1])),
      purchasingRequestCounts: optional(enums([0, 1])),
      pendingApprovalCount: optional(enums([0, 1])),
      recentApprovals: optional(enums([0, 1])),
      finance: optional(enums([0, 1])),
      receiptCount: optional(enums([0, 1])),
      fiscalYear: optional(enums([0, 1])),
      paymentOrders: optional(enums([0, 1])),
    }),
  });
};
