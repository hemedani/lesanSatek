export type FeatureName =
  | "canRegisterPurchaseRequest"
  | "canApprovePurchaseRequest"
  | "canAssignItemsToOrder"
  | "canCreateTender"
  | "canRespondToTender"
  | "canViewWarehouse"
  | "canManageUnitInventory"
  | "canCreateConsumptionRecord"
  | "canManageBudget"
  | "canViewBudgetReports"
  | "canManageFeatures"
  | "canConfirmGoodsReceipt"
  | "canIssuePaymentOrder"
  | "canViewHistory"
  | "canSubmitPurchaseRequest";

export type RoleName =
  | "Manager"
  | "Admin"
  | "OrgHead"
  | "UnitHead"
  | "StoreHead"
  | "Employee"
  | "Ordinary";

export type ScopeType = "organization" | "unit" | "store";

export interface FeatureOption {
  value: FeatureName;
  label: string;
}

export interface RoleOption {
  value: RoleName;
  label: string;
}

export const FEATURES_OPTIONS: FeatureOption[] = [
  { value: "canRegisterPurchaseRequest", label: "ثبت درخواست خرید" },
  { value: "canApprovePurchaseRequest", label: "تایید درخواست خرید" },
  { value: "canAssignItemsToOrder", label: "اختصاص آیتم به سفارش" },
  { value: "canCreateTender", label: "ایجاد مناقصه" },
  { value: "canRespondToTender", label: "پاسخ به مناقصه" },
  { value: "canViewWarehouse", label: "مشاهده انبار" },
  { value: "canManageUnitInventory", label: "مدیریت موجودی واحد" },
  { value: "canCreateConsumptionRecord", label: "ثبت مصرف" },
  { value: "canManageBudget", label: "مدیریت بودجه" },
  { value: "canViewBudgetReports", label: "مشاهده گزارش بودجه" },
  { value: "canManageFeatures", label: "مدیریت دسترسی‌ها" },
  { value: "canConfirmGoodsReceipt", label: "تایید رسید کالا" },
  { value: "canIssuePaymentOrder", label: "صدور دستور پرداخت" },
  { value: "canViewHistory", label: "مشاهده تاریخچه" },
  { value: "canSubmitPurchaseRequest", label: "ارسال درخواست خرید" },
];

export const ROLE_OPTIONS: RoleOption[] = [
  { value: "Ordinary", label: "عادی" },
  { value: "Employee", label: "کارمند" },
  { value: "UnitHead", label: "رئیس واحد" },
  { value: "StoreHead", label: "رئیس فروشگاه" },
  { value: "OrgHead", label: "رئیس سازمان" },
  { value: "Admin", label: "ادمین" },
  { value: "Manager", label: "مدیر" },
];

export const SCOPE_OPTIONS: { value: ScopeType | ""; label: string }[] = [
  { value: "", label: "بدون محدودیت" },
  { value: "organization", label: "سازمان" },
  { value: "unit", label: "واحد" },
  { value: "store", label: "فروشگاه" },
];

export const ALL_ROLE_NAMES: RoleName[] = [
  "Manager",
  "Admin",
  "OrgHead",
  "UnitHead",
  "StoreHead",
  "Employee",
  "Ordinary",
];

export const ORGHEAD_ASSIGNABLE_ROLE_NAMES: RoleName[] = [
  "OrgHead",
  "UnitHead",
  "Employee",
  "Ordinary",
];

export function getAssignableRoleNames(actorRoleName?: string | null): RoleName[] {
  if (actorRoleName === "OrgHead") return [...ORGHEAD_ASSIGNABLE_ROLE_NAMES];
  if (actorRoleName === "Admin") return ALL_ROLE_NAMES.filter((role) => role !== "Manager");
  return [...ALL_ROLE_NAMES];
}

export function getAssignableRoleOptions(actorRoleName?: string | null): RoleOption[] {
  const allowed = getAssignableRoleNames(actorRoleName);
  return ROLE_OPTIONS.filter((option) => allowed.includes(option.value));
}

export function isRoleAssignableBy(
  actorRoleName: string | null | undefined,
  targetRoleName: string | null | undefined,
): boolean {
  if (!targetRoleName) return false;
  return getAssignableRoleNames(actorRoleName).includes(targetRoleName as RoleName);
}

export function getAssignableScopeOptions(
  actorRoleName?: string | null,
): { value: ScopeType | ""; label: string }[] {
  if (actorRoleName === "OrgHead") {
    return SCOPE_OPTIONS.filter((option) => option.value !== "store");
  }
  return SCOPE_OPTIONS;
}
