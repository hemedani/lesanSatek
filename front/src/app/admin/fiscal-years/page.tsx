import { cookies } from "next/headers"
import { gets } from "@/app/actions/fiscalYear/gets"
import { FiscalYearsClient } from "./fiscal-years-client"
import type { FiscalYear } from "./fiscal-years-client"

const LIMIT = 20

const FY_PROJECTION = {
  _id: 1,
  name: 1,
  status: 1,
  isActive: 1,
  startDate: 1,
  endDate: 1,
  createdAt: 1,
  organization: { _id: 1, name: 1 },
  budgetLines: { _id: 1 },
} as const

type SortKey = "createdAt-desc" | "createdAt-asc" | "name-asc" | "name-desc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "updatedAt" | "name" | "startDate" | "endDate"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "name-asc": { sortBy: "name", sortOrder: "asc" },
  "name-desc": { sortBy: "name", sortOrder: "desc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

export default async function FiscalYearsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string; status?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const sort: SortKey = isSortKey(resolvedSearchParams.sort || "") ? (resolvedSearchParams.sort as SortKey) : "createdAt-desc"
  const { sortBy, sortOrder } = SORT_MAP[sort]
  const status = resolvedSearchParams.status === "closed" ? ("closed" as const) : resolvedSearchParams.status === "open" ? ("open" as const) : ""

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value || ""

  const listSet = {
    activeRoleId,
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(search ? { name: search } : {}),
    ...(status ? { status } : {}),
  }

  const [listResult, countResult] = await Promise.all([
    gets(listSet, FY_PROJECTION),
    gets({ activeRoleId, page: 1, limit: 100, ...(search ? { name: search } : {}), ...(status ? { status } : {}) }, { _id: 1 }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as FiscalYear[]
  const all = (countResult.success ? countResult.body || [] : []) as { _id: string }[]
  const total = countResult.success ? all.length : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  if (status) params.set("status", status)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/fiscal-years?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/fiscal-years?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <FiscalYearsClient
      items={items}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      total={total}
      search={search}
      sort={sort}
      status={status}
    />
  )
}
