import {
  endOfMonth as endOfJalaliMonth,
  startOfMonth as startOfJalaliMonth,
  startOfYear as startOfJalaliYear,
} from "date-fns-jalali"

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

/**
 * Calendar day of a Jalali-aware `date-fns-jalali` result, rebuilt as a UTC
 * boundary. The jalali helpers return local midnights; rebuilding the same
 * calendar day in UTC keeps the range independent of the machine's timezone,
 * which matters because entry dates are stored as UTC instants.
 */
function utcBoundary(date: Date, endOfDay: boolean): Date {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
    ),
  )
}

/**
 * Bounds of the current **Jalali** month.
 *
 * The whole product is Jalali — fiscal years, accounting periods, date pickers
 * and every rendered date — so the "this month" shortcut must follow the Jalali
 * calendar. Using the Gregorian month silently dropped every entry dated in the
 * Persian month that straddles a Gregorian month boundary (e.g. آبان).
 */
export function monthBounds(date: Date): { startDate: string; endDate: string } {
  return {
    startDate: utcBoundary(startOfJalaliMonth(date), false).toISOString(),
    endDate: utcBoundary(endOfJalaliMonth(date), true).toISOString(),
  }
}

export function startOfYearIso(date = new Date()): string {
  return utcBoundary(startOfJalaliYear(date), false).toISOString()
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
