import { enums, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";

export const dashboardStatisticValidator = () => {
  return object({
    set: object({
      ...activeRoleMixin,
      type: enums(["unitHead", "orgHead"]),
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

      prStatusDistribution: optional(enums([0, 1])),
      prMonthlyTrend: optional(enums([0, 1])),
      prCycleTime: optional(enums([0, 1])),
      budgetLineBreakdown: optional(enums([0, 1])),
      budgetBurnDown: optional(enums([0, 1])),
      inventorySummary: optional(enums([0, 1])),
      inventoryLowStock: optional(enums([0, 1])),
      consumptionTrend: optional(enums([0, 1])),
      consumptionByUnit: optional(enums([0, 1])),
      consumptionByCategory: optional(enums([0, 1])),
      procurementByStore: optional(enums([0, 1])),
      selectionBreakdown: optional(enums([0, 1])),
      stockMovementSummary: optional(enums([0, 1])),
      stepBottleneck: optional(enums([0, 1])),
    }),
  });
};
