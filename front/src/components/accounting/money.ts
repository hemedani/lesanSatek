const numberFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
})

const amountFormatter = new Intl.NumberFormat("fa-IR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatAmount(value: number | string | null | undefined): string {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) return "۰"
  return amountFormatter.format(numeric)
}

export function formatRial(value: number | string | null | undefined): string {
  return `${formatAmount(value)} ریال`
}

export function formatCount(value: number | string | null | undefined): string {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) return "۰"
  return numberFormatter.format(numeric)
}

export function parseAmount(value: string): number {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[,٬\s]/g, "")
    .replace(/[^0-9.-]/g, "")

  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : 0
}

export function formatJalaliDate(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatJalaliDateTime(
  value: string | Date | null | undefined,
): string {
  if (!value) return "—"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return `${date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}، ${date.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`
}

export function formatMonthCode(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function currentMonthBounds(): { startDate: string; endDate: string } {
  const now = new Date()
  return monthBounds(now)
}

export function monthBounds(date: Date): { startDate: string; endDate: string } {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0))
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59))
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

export function startOfYearIso(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0)).toISOString()
}

export function endOfTodayIso(): string {
  const now = new Date()
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59),
  ).toISOString()
}

export function isBalanced(
  debit: number,
  credit: number,
  tolerance = 0.01,
): boolean {
  return Math.abs(debit - credit) <= tolerance
}
