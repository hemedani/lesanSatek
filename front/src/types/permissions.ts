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
  | "canViewHistory";

export type RoleName =
  | "Manager"
  | "Admin"
  | "OrgHead"
  | "UnitHead"
  | "Employee"
  | "Ordinary";

export type ScopeType = "organization" | "unit";

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
];

export const ROLE_OPTIONS: RoleOption[] = [
  { value: "Ordinary", label: "عادی" },
  { value: "Employee", label: "کارمند" },
  { value: "UnitHead", label: "رئیس واحد" },
  { value: "OrgHead", label: "رئیس سازمان" },
  { value: "Admin", label: "ادمین" },
  { value: "Manager", label: "مدیر" },
];

export const SCOPE_OPTIONS: { value: ScopeType | ""; label: string }[] = [
  { value: "", label: "بدون محدودیت" },
  { value: "organization", label: "سازمان" },
  { value: "unit", label: "واحد" },
];
