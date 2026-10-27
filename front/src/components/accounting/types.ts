export interface OrganizationOption {
  _id: string
  name?: string
}

export interface Account {
  _id: string
  code?: string
  name?: string
  enName?: string
  description?: string
  accountType?: string
  normalBalance?: string
  systemKey?: string
  level?: number
  isPostable?: boolean
  isActive?: boolean
  isSystem?: boolean
  organization?: { _id: string; name?: string }
  parentAccount?: { _id: string; code?: string; name?: string }
}

export interface AccountingPeriod {
  _id: string
  code?: string
  name?: string
  startDate?: string
  endDate?: string
  status?: string
  closedAt?: string
  organization?: { _id: string; name?: string }
  fiscalYear?: { _id: string; name?: string }
  closedBy?: { _id: string; first_name?: string; last_name?: string }
}

export interface CostCenter {
  _id: string
  code?: string
  name?: string
  description?: string
  type?: string
  isActive?: boolean
  organization?: { _id: string; name?: string }
  unit?: { _id: string; name?: string }
  responsibleUser?: { _id: string; first_name?: string; last_name?: string }
}

export interface JournalLine {
  _id?: string
  lineNumber?: number
  description?: string
  debit?: number
  credit?: number
  account?: { _id: string; code?: string; name?: string; accountType?: string }
  costCenter?: { _id: string; code?: string; name?: string } | null
  unit?: { _id: string; name?: string } | null
  store?: { _id: string; name?: string } | null
}

export interface JournalEntry {
  _id: string
  entryNumber?: string
  entryDate?: string
  description?: string
  reference?: string
  sourceType?: string
  sourceId?: string
  sourceEvent?: string
  status?: string
  totalDebit?: number
  totalCredit?: number
  isBalanced?: boolean
  postedAt?: string
  lineSnapshot?: unknown
  organization?: { _id: string; name?: string }
  period?: { _id: string; code?: string; name?: string; status?: string }
  createdBy?: { _id: string; first_name?: string; last_name?: string }
  lines?: JournalLine[]
}

export interface JournalLineInput {
  accountId?: string
  systemKey?: string
  description?: string
  debit?: number
  credit?: number
  costCenterId?: string
  unitId?: string
  storeId?: string
}

export interface TrialBalanceRow {
  accountId: string
  code: string
  name: string
  accountType: string
  normalBalance: string
  debit: number
  credit: number
  balance: number
}

export interface TrialBalance {
  accounts: TrialBalanceRow[]
  totals: { debit: number; credit: number; difference: number }
}

export interface GeneralLedgerLine {
  _id: string
  lineNumber: number
  description: string | null
  debit: number
  credit: number
  runningBalance: number
  entryId: string | null
  entryNumber: string | null
  entryDate: string | null
  costCenterId: string | null
  costCenterName: string | null
  storeId: string | null
  storeName: string | null
}

export interface GeneralLedger {
  account: {
    _id: string
    code: string
    name: string
    accountType: string
    normalBalance: string
  }
  openingBalance: number
  lines: GeneralLedgerLine[]
  totals: { debit: number; credit: number }
  closingBalance: number
}

export interface IncomeStatementRow {
  accountId: string
  code: string
  name: string
  accountType: string
  debit: number
  credit: number
  amount: number
}

export interface IncomeStatement {
  revenue: IncomeStatementRow[]
  expenses: IncomeStatementRow[]
  totalRevenue: number
  totalExpenses: number
  netIncome: number
}

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  return []
}

export function firstItem<T>(value: unknown): T | null {
  const items = asArray<T>(value)
  return items[0] ?? null
}

export function readCount(value: unknown): number {
  if (typeof value === "number") return value
  if (value && typeof value === "object" && "qty" in value) {
    const qty = Number((value as { qty?: unknown }).qty)
    return Number.isFinite(qty) ? qty : 0
  }
  if (value && typeof value === "object" && "count" in value) {
    const count = Number((value as { count?: unknown }).count)
    return Number.isFinite(count) ? count : 0
  }
  return 0
}
