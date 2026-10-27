export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: "دارایی",
  liability: "بدهی",
  equity: "حقوق صاحبان سهام",
  revenue: "درآمد",
  expense: "هزینه",
}

export const NORMAL_BALANCE_LABELS: Record<string, string> = {
  debit: "بدهکار",
  credit: "بستانکار",
}

export const ENTRY_STATUS_LABELS: Record<string, string> = {
  draft: "پیش‌نویس",
  posted: "ثبت‌شده",
  reversed: "برگشت‌خورده",
}

export const SOURCE_TYPE_LABELS: Record<string, string> = {
  goodsReceipt: "رسید کالا",
  consumption: "مصرف",
  paymentOrder: "دستور پرداخت",
  budget: "بودجه",
  manual: "دستی",
  adjustment: "تعدیل",
  opening: "افتتاحیه",
  reversal: "برگشت",
}

export const PERIOD_STATUS_LABELS: Record<string, string> = {
  open: "باز",
  closed: "بسته",
  locked: "قفل",
}

export const COST_CENTER_TYPE_LABELS: Record<string, string> = {
  cost: "هزینه",
  profit: "سود",
}

export const SYSTEM_KEY_LABELS: Record<string, string> = {
  inventory: "موجودی کالا",
  accountsPayable: "حساب‌های پرداختنی",
  cash: "نقد",
  bank: "بانک",
  cogs: "بهای تمام‌شده کالای فروش‌رفته",
  operatingExpense: "هزینه‌های عملیاتی",
  inventoryAdjustment: "تعدیل موجودی",
  grni: "کالای دریافت‌شده بدون فاکتور",
  accountsReceivable: "حساب‌های دریافتنی",
  revenue: "درآمد",
  equity: "حقوق صاحبان سهام",
  retainedEarnings: "سود انباشته",
}

export const ACCOUNT_TYPE_OPTIONS = Object.entries(ACCOUNT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const NORMAL_BALANCE_OPTIONS = Object.entries(NORMAL_BALANCE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const ENTRY_STATUS_OPTIONS = Object.entries(ENTRY_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const SOURCE_TYPE_OPTIONS = Object.entries(SOURCE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const PERIOD_STATUS_OPTIONS = Object.entries(PERIOD_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const COST_CENTER_TYPE_OPTIONS = Object.entries(
  COST_CENTER_TYPE_LABELS,
).map(([value, label]) => ({ value, label }))

export const SYSTEM_KEY_OPTIONS = Object.entries(SYSTEM_KEY_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export function labelOf(
  map: Record<string, string>,
  value: string | null | undefined,
  fallback = "—",
): string {
  if (!value) return fallback
  return map[value] ?? value
}
