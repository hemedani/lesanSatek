import { enums } from "lesan";

export const feature_array = [
  "canRegisterPurchaseRequest",
  "canApprovePurchaseRequest",
  "canAssignItemsToOrder",
  "canCreateTender",
  "canRespondToTender",
  "canViewWarehouse",
  "canManageUnitInventory",
  "canCreateConsumptionRecord",
  "canManageBudget",
  "canViewBudgetReports",
  "canManageFeatures",
  "canConfirmGoodsReceipt",
  "canIssuePaymentOrder",
  "canViewHistory",
] as const;

export const feature_enums = enums(feature_array);
