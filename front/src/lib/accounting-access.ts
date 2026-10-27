export const ACCOUNTING_FEATURES = {
  view: "canViewAccounting",
  manage: "canManageAccounting",
  closePeriod: "canCloseAccountingPeriod",
  postManual: "canPostManualJournalEntry",
} as const

const has = (features: string[], feature: string): boolean =>
  features.includes(feature)

export function canViewAccounting(features: string[]): boolean {
  return has(features, ACCOUNTING_FEATURES.view)
}

export function canManageAccounting(features: string[]): boolean {
  return has(features, ACCOUNTING_FEATURES.manage)
}

export function canCloseAccountingPeriod(features: string[]): boolean {
  return has(features, ACCOUNTING_FEATURES.closePeriod)
}

export function canPostManualJournalEntry(features: string[]): boolean {
  return has(features, ACCOUNTING_FEATURES.postManual)
}
