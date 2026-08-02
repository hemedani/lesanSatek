import { gets as getUnits } from "@/app/actions/unit/gets"
import { count as countUnits } from "@/app/actions/unit/count"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { UnitsClient } from "./units-client"
import type { Unit, OrganizationOption } from "./units-client"

const LIMIT = 20

const UNIT_PROJECTION = {
  _id: 1,
  name: 1,
  type: 1,
  isActive: 1,
  description: 1,
  createdAt: 1,
  organization: { _id: 1, name: 1 },
  parentUnit: { _id: 1, name: 1 },
  head: { _id: 1, first_name: 1, last_name: 1 },
} as const

type UnitType = "General" | "Warehouse" | "Logistics" | "Production" | "Administration" | "Finance" | "Expert"

function isUnitType(value: string): value is UnitType {
  return ["General", "Warehouse", "Logistics", "Production", "Administration", "Finance", "Expert"].includes(value)
}

type SortKey = "createdAt-desc" | "createdAt-asc" | "name-asc" | "name-desc"

const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "name"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "name-asc": { sortBy: "name", sortOrder: "asc" },
  "name-desc": { sortBy: "name", sortOrder: "desc" },
}

function isSortKey(value: string): value is SortKey {
  return Object.prototype.hasOwnProperty.call(SORT_MAP, value)
}

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; orgId?: string; type?: string; sort?: string }>
}) {
  const resolved = await searchParams

  const page = Math.max(1, Number(resolved.page) || 1)
  const search = typeof resolved.search === "string" ? resolved.search : ""
  const orgId = typeof resolved.orgId === "string" ? resolved.orgId : ""
  const type: UnitType | "" = isUnitType(resolved.type || "") ? resolved.type as UnitType : ""
  const sort: SortKey = isSortKey(resolved.sort || "") ? resolved.sort as SortKey : "createdAt-desc"
  const { sortBy, sortOrder } = SORT_MAP[sort]

  const listSet = {
    activeRoleId: "",
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(orgId ? { organizationId: orgId } : {}),
    ...(type ? { type } : {}),
  }

  const [listResult, countResult, orgsResult] = await Promise.all([
    getUnits(listSet, UNIT_PROJECTION),
    countUnits({
      activeRoleId: "",
      ...(search ? { name: search } : {}),
      ...(orgId ? { organizationId: orgId } : {}),
      ...(type ? { type } : {}),
    }),
    getOrganizations({ activeRoleId: "", page: 1, limit: 50 }, { _id: 1, name: 1 }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as Unit[]
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const orgs = (orgsResult.success ? orgsResult.body || [] : []) as OrganizationOption[]

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (orgId) params.set("orgId", orgId)
  if (type) params.set("type", type)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/units?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/units?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <UnitsClient
      items={items}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      search={search}
      orgId={orgId}
      type={type}
      sort={sort}
      orgOptions={orgs}
    />
  )
}
