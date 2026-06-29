/**
 * Feature Constants — Feature flag enum definitions.
 *
 * Defines all available feature flags that can be assigned to Users and Units
 * for fine-grained permission control (e.g., canRegisterPurchaseRequest,
 * canApprovePurchaseRequest, canManageBudget, etc.). Used by the checkFeature
 * utility to gate access to specific system actions beyond role-based access.
 *
 * @example
 * // Typical usage: a Purchasing Manager user might have:
 * [
 *   { feature: "canRegisterPurchaseRequest" },
 *   { feature: "canApprovePurchaseRequest" },
 *   { feature: "canCreateTender" }
 * ]
 */
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
