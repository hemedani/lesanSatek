"use client"

import { CalendarRange, Landmark } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker"
import { FilterSelect } from "@/components/ui/filter-select"
import { AccountSelect } from "@/components/accounting/account-select"
import { OrganizationSelector } from "@/components/accounting/organization-selector"
import { endOfTodayIso, monthBounds, startOfYearIso } from "@/components/accounting/money"
import type {
  Account,
  AccountingPeriod,
  OrganizationOption,
} from "@/components/accounting/types"

interface ReportFiltersProps {
  organizations?: OrganizationOption[]
  organizationId?: string
  periods: AccountingPeriod[]
  periodId: string
  startDate: string
  endDate: string
  accounts?: Account[]
  accountId?: string
  showAccount?: boolean
}

function ReportFilters({
  organizations,
  organizationId,
  periods,
  periodId,
  startDate,
  endDate,
  accounts,
  accountId,
  showAccount,
}: ReportFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const push = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.delete("page")
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const setRange = (start?: string, end?: string) => {
    push({ startDate: start || null, endDate: end || null, periodId: null })
  }

  const thisMonth = () => {
    const bounds = monthBounds(new Date())
    setRange(bounds.startDate, bounds.endDate)
  }

  const lastMonth = () => {
    const now = new Date()
    const bounds = monthBounds(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)))
    setRange(bounds.startDate, bounds.endDate)
  }

  const thisYear = () => {
    setRange(startOfYearIso(), endOfTodayIso())
  }

  return (
    <div className="glass-card space-y-4 rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        {organizations && organizationId && (
          <OrganizationSelector organizations={organizations} value={organizationId} />
        )}
        <FilterSelect
          icon={CalendarRange}
          placeholder="دوره حسابداری"
          value={periodId}
          onValueChange={(value) => push({ periodId: value, startDate: null, endDate: null })}
          options={periods.map((period) => ({
            value: period._id,
            label: `${period.code || ""} ${period.name || ""}`.trim(),
          }))}
          ariaLabel="انتخاب دوره حسابداری"
        />
        <div className="w-44">
          <JalaliDatePicker
            date={startDate ? new Date(startDate) : undefined}
            onSelect={(date) => push({ startDate: date ? date.toISOString() : null, periodId: null })}
            placeholder="از تاریخ"
          />
        </div>
        <div className="w-44">
          <JalaliDatePicker
            date={endDate ? new Date(endDate) : undefined}
            onSelect={(date) => push({ endDate: date ? date.toISOString() : null, periodId: null })}
            placeholder="تا تاریخ"
          />
        </div>
        {showAccount && accounts && (
          <div className="min-w-64 flex-1 sm:max-w-sm">
            <AccountSelect
              accounts={accounts}
              value={accountId}
              onChange={(value) => push({ accountId: value })}
              placeholder="انتخاب حساب برای دفتر کل…"
              ariaLabel="انتخاب حساب"
              includeInactive
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-fog/60">بازه‌های سریع:</span>
        <Button type="button" variant="outline" size="sm" onClick={thisMonth}>
          این ماه
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={lastMonth}>
          ماه گذشته
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={thisYear} className="gap-1.5">
          <Landmark className="size-3.5" />
          امسال
        </Button>
        {(startDate || endDate || periodId) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => push({ startDate: null, endDate: null, periodId: null })}
          >
            پاک کردن بازه
          </Button>
        )}
      </div>
    </div>
  )
}

export { ReportFilters }
