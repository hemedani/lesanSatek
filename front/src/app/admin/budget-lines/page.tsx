import { cookies } from "next/headers"
import { gets } from "@/app/actions/budgetLine/gets"
import { count } from "@/app/actions/budgetLine/count"
import { gets as getFiscalYears } from "@/app/actions/fiscalYear/gets"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { BudgetLinesClient } from "./budget-lines-client"
import type { BudgetLine } from "./budget-lines-client"

const LIMIT = 20

const BL_PROJECTION = {
  _id: 1,
  code: 1,
  title: 1,
  description: 1,
  totalAllocated: 1,
  totalEncumbered: 1,
  totalSpent: 1,
  remainingBudget: 1,
  createdAt: 1,
  fiscalYear: { _id: 1, name: 1 },
  organization: { _id: 1, name: 1 },
  unit: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

type SortKey =
  | "createdAt-desc"
  | "createdAt-asc"
  | "code-asc"
  | "code-desc"
  | "title-asc"
  | "title-desc"
  | "totalAllocated-desc"
  | "totalAllocated-asc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "code" | "title" | "totalAllocated"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "code-asc": { sortBy: "code", sortOrder: "asc" },
  "code-desc": { sortBy: "code", sortOrder: "desc" },
  "title-asc": { sortBy: "title", sortOrder: "asc" },
  "title-desc": { sortBy: "title", sortOrder: "desc" },
  "totalAllocated-desc": { sortBy: "totalAllocated", sortOrder: "desc" },
  "totalAllocated-asc": { sortBy: "totalAllocated", sortOrder: "asc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

export default async function BudgetLinesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string; fiscalYearId?: string; organizationId?: string; unitId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const sort: SortKey = isSortKey(resolvedSearchParams.sort || "") ? (resolvedSearchParams.sort as SortKey) : "createdAt-desc"
  const { sortBy, sortOrder } = SORT_MAP[sort]
  const fiscalYearId = typeof resolvedSearchParams.fiscalYearId === "string" ? resolvedSearchParams.fiscalYearId : ""
  const organizationId = typeof resolvedSearchParams.organizationId === "string" ? resolvedSearchParams.organizationId : ""
  const unitId = typeof resolvedSearchParams.unitId === "string" ? resolvedSearchParams.unitId : ""

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value || ""

  const listSet = {
    activeRoleId,
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(search ? { title: search } : {}),
    ...(fiscalYearId ? { fiscalYearId } : {}),
    ...(organizationId ? { organizationId } : {}),
    ...(unitId ? { unitId } : {}),
  }

  const totalSet = {
    activeRoleId,
    ...(fiscalYearId ? { fiscalYearId } : {}),
    ...(organizationId ? { organizationId } : {}),
    ...(unitId ? { unitId } : {}),
  }

  const [listResult, countResult, fiscalYearsResult, organizationsResult, unitsResult] = await Promise.all([
    gets(listSet, BL_PROJECTION),
    search
      ? gets({ ...listSet, page: 1, limit: 100 }, { _id: 1 })
      : count(totalSet),
    getFiscalYears({ activeRoleId, page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }, { _id: 1, name: 1 }),
    getOrganizations({ activeRoleId, page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }, { _id: 1, name: 1 }),
    getUnits({ activeRoleId, page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }, { _id: 1, name: 1 }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as BudgetLine[]
  const all = (countResult.success ? countResult.body || [] : []) as { _id: string }[]
  const total = search
    ? (countResult.success ? all.length : items.length)
    : (countResult.success && typeof all === "object" && all && "qty" in all
      ? (all as unknown as { qty: number }).qty
      : items.length)
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const fiscalYears = (fiscalYearsResult.success ? fiscalYearsResult.body || [] : []) as { _id: string; name?: string }[]
  const organizations = (organizationsResult.success ? organizationsResult.body || [] : []) as { _id: string; name?: string }[]
  const units = (unitsResult.success ? unitsResult.body || [] : []) as { _id: string; name?: string }[]

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  if (fiscalYearId) params.set("fiscalYearId", fiscalYearId)
  if (organizationId) params.set("organizationId", organizationId)
  if (unitId) params.set("unitId", unitId)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/budget-lines?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/budget-lines?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <BudgetLinesClient
      items={items}
      fiscalYears={fiscalYears}
      organizations={organizations}
      units={units}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      total={total}
      search={search}
      sort={sort}
      fiscalYearId={fiscalYearId}
      organizationId={organizationId}
      unitId={unitId}
    />
  )
}
