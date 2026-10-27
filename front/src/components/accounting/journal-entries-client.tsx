"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CalendarRange, FileText, Hash, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker"
import { AccountingFilters, type AccountingFilterSelect } from "@/components/accounting/accounting-filters"
import { JournalEntryTable } from "@/components/accounting/journal-entry-table"
import { ENTRY_STATUS_OPTIONS, SOURCE_TYPE_OPTIONS } from "@/components/accounting/labels"
import type {
  AccountingPeriod,
  JournalEntry,
  OrganizationOption,
} from "@/components/accounting/types"

interface JournalEntriesClientProps {
  entries: JournalEntry[]
  periods: AccountingPeriod[]
  basePath: string
  canPostManual: boolean
  organizations?: OrganizationOption[]
  organizationId?: string
  search: string
  periodId: string
  sourceType: string
  status: string
  startDate: string
  endDate: string
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
}

function JournalEntriesClient({
  entries,
  periods,
  basePath,
  canPostManual,
  organizations,
  organizationId,
  search,
  periodId,
  sourceType,
  status,
  startDate,
  endDate,
  prevUrl,
  nextUrl,
  page,
  totalPages,
}: JournalEntriesClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const push = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  const filters: AccountingFilterSelect[] = [
    {
      key: "sourceType",
      placeholder: "نوع منبع",
      value: sourceType,
      options: SOURCE_TYPE_OPTIONS,
      icon: FileText,
    },
    {
      key: "status",
      placeholder: "وضعیت سند",
      value: status,
      options: ENTRY_STATUS_OPTIONS,
      icon: Hash,
    },
    {
      key: "periodId",
      placeholder: "دوره حسابداری",
      value: periodId,
      options: periods.map((period) => ({
        value: period._id,
        label: `${period.code || ""} ${period.name || ""}`.trim(),
      })),
      icon: CalendarRange,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <AccountingFilters
            searchValue={search}
            searchPlaceholder="جستجوی شماره سند…"
            searchKey="entryNumber"
            selects={filters}
            organizations={organizations}
            organizationId={organizationId}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-fog/60">بازه تاریخ:</span>
            <div className="w-44">
              <JalaliDatePicker
                date={startDate ? new Date(startDate) : undefined}
                onSelect={(date) => push("startDate", date ? date.toISOString() : null)}
                placeholder="از تاریخ"
              />
            </div>
            <div className="w-44">
              <JalaliDatePicker
                date={endDate ? new Date(endDate) : undefined}
                onSelect={(date) => push("endDate", date ? date.toISOString() : null)}
                placeholder="تا تاریخ"
              />
            </div>
          </div>
        </div>
        {canPostManual && (
          <Button render={<Link href={`${basePath}/journal-entries/new`} />} className="gap-2">
            <Plus className="size-4" />
            ثبت سند دستی
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="سندی یافت نشد"
          description="با تغییر فیلترها جستجو کنید یا اولین سند دستی را ثبت کنید."
        />
      ) : (
        <JournalEntryTable entries={entries} basePath={basePath} />
      )}

      <Pagination prevUrl={prevUrl} nextUrl={nextUrl} page={page} totalPages={totalPages} />
    </div>
  )
}

export { JournalEntriesClient }
