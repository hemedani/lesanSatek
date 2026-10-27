"use client"

import { Building2 } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { FilterSelect } from "@/components/ui/filter-select"
import type { OrganizationOption } from "@/components/accounting/types"

interface OrganizationSelectorProps {
  organizations: OrganizationOption[]
  value: string
}

function OrganizationSelector({ organizations, value }: OrganizationSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (organizations.length <= 1) return null

  const handleChange = (next: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next) params.set("organizationId", next)
    else params.delete("organizationId")
    params.delete("page")
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  return (
    <FilterSelect
      icon={Building2}
      placeholder="انتخاب سازمان"
      value={value}
      onValueChange={handleChange}
      options={organizations.map((organization) => ({
        value: organization._id,
        label: organization.name || "سازمان بدون نام",
      }))}
      ariaLabel="انتخاب سازمان"
    />
  )
}

export { OrganizationSelector }
