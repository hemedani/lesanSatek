"use client"

import type { LucideIcon } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { SearchField } from "@/components/ui/search-field"
import { FilterSelect, type FilterOption } from "@/components/ui/filter-select"
import { OrganizationSelector } from "@/components/accounting/organization-selector"
import type { OrganizationOption } from "@/components/accounting/types"

export interface AccountingFilterSelect {
  key: string
  placeholder: string
  value: string
  options: FilterOption[]
  icon?: LucideIcon
  ariaLabel?: string
}

interface AccountingFiltersProps {
  searchValue?: string
  searchPlaceholder?: string
  searchKey?: string
  selects?: AccountingFilterSelect[]
  organizations?: OrganizationOption[]
  organizationId?: string
}

function AccountingFilters({
  searchValue = "",
  searchPlaceholder = "جستجو…",
  searchKey = "search",
  selects = [],
  organizations,
  organizationId,
}: AccountingFiltersProps) {
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

  const hasFilters =
    !!searchValue ||
    selects.some((select) => !!select.value)

  const reset = () => {
    const params = new URLSearchParams()
    const org = searchParams.get("organizationId")
    if (org) params.set("organizationId", org)
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchField
        value={searchValue}
        onChange={(value) => push(searchKey, value)}
        placeholder={searchPlaceholder}
        className="w-full sm:w-64"
      />
      {selects.map((select) => (
        <FilterSelect
          key={select.key}
          icon={select.icon}
          placeholder={select.placeholder}
          value={select.value}
          onValueChange={(value) => push(select.key, value)}
          options={select.options}
          ariaLabel={select.ariaLabel || select.placeholder}
        />
      ))}
      {organizations && organizationId && (
        <OrganizationSelector organizations={organizations} value={organizationId} />
      )}
      {hasFilters && (
        <button
          type="button"
          onClick={reset}
          className="text-xs text-fog/60 underline-offset-4 transition-colors hover:text-moonlight hover:underline"
        >
          حذف فیلترها
        </button>
      )}
    </div>
  )
}

export { AccountingFilters }
