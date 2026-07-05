"use client"

import { cn } from "@/lib/utils"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RotateCcw } from "lucide-react"

interface FilterOption {
  value: string
  label: string
}

interface FilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  status?: string
  onStatusChange?: (value: string) => void
  statusOptions?: FilterOption[]
  onReset?: () => void
  children?: React.ReactNode
  className?: string
}

function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  status,
  onStatusChange,
  statusOptions,
  onReset,
  children,
  className,
}: FilterBarProps) {
  const hasFilters = search || status

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        className="w-full sm:w-56"
      />
      {statusOptions && onStatusChange && (
        <Select
          value={status || ""}
          onValueChange={onStatusChange}
          dir="rtl"
        >
          <SelectTrigger className="w-36 h-8 text-sm" dir="rtl">
            <SelectValue placeholder="همه وضعیت‌ها" />
          </SelectTrigger>
          <SelectContent dir="rtl">
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {children}
      {hasFilters && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1">
          <RotateCcw className="size-3.5" />
          پاک کردن
        </Button>
      )}
    </div>
  )
}

export { FilterBar }
