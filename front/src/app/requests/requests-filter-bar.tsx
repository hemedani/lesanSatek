"use client"

import { ListFilter, GitBranch, ArrowDownUp, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { cn } from "@/lib/utils"

const statusOptions: FilterOption[] = [
  { value: "Draft", label: "پیش‌نویس" },
  { value: "Pending", label: "در انتظار بررسی" },
  { value: "InProgress", label: "در حال انجام" },
  { value: "Approved", label: "تأیید شده" },
  { value: "PendingFinalization", label: "در انتظار تأیید نهایی" },
  { value: "Rejected", label: "رد شده" },
  { value: "Completed", label: "تکمیل شده" },
  { value: "Cancelled", label: "لغو شده" },
]

const sortOptions: FilterOption[] = [
  { value: "desc", label: "جدیدترین" },
  { value: "asc", label: "قدیمی‌ترین" },
]

interface RequestsFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string | null) => void
  processId: string
  onProcessChange: (value: string | null) => void
  processOptions: FilterOption[]
  sort: "asc" | "desc"
  onSortChange: (value: string | null) => void
  onReset: () => void
  hasActiveFilters: boolean
  className?: string
}

function RequestsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  processId,
  onProcessChange,
  processOptions,
  sort,
  onSortChange,
  onReset,
  hasActiveFilters,
  className,
}: RequestsFilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-2.5 lg:flex-row lg:items-stretch", className)}>
      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder="جستجو در درخواست‌ها…"
        ariaLabel="جستجو در درخواست‌های خرید"
        className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
      />
      <div className="flex flex-wrap items-stretch gap-2.5">
        <FilterSelect
          icon={ListFilter}
          placeholder="همه وضعیت‌ها"
          ariaLabel="فیلتر وضعیت درخواست"
          value={status}
          onValueChange={onStatusChange}
          options={statusOptions}
        />
        {processOptions.length > 0 && (
          <FilterSelect
            icon={GitBranch}
            placeholder="همه فرآیندها"
            ariaLabel="فیلتر فرآیند درخواست"
            value={processId}
            onValueChange={onProcessChange}
            options={processOptions}
          />
        )}
        <FilterSelect
          icon={ArrowDownUp}
          placeholder="مرتب‌سازی"
          ariaLabel="ترتیب نمایش درخواست‌ها"
          value={sort}
          onValueChange={onSortChange}
          options={sortOptions}
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={onReset}
            className="h-11 gap-2 rounded-sm px-4 text-body-sm text-moonlight"
          >
            <RotateCcw className="size-5" strokeWidth={2} />
            پاک کردن فیلترها
          </Button>
        )}
      </div>
    </div>
  )
}

export { RequestsFilterBar }
