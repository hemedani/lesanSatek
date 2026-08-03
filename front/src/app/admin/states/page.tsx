import { cookies } from "next/headers"
import { gets } from "@/app/actions/state/gets"
import { count } from "@/app/actions/state/count"
import { StatesClient } from "./states-client"
import type { State } from "./states-client"

const LIMIT = 20

const STATE_PROJECTION = {
  _id: 1,
  name: 1,
  enName: 1,
  createdAt: 1,
  cities: { _id: 1 },
} as const

type SortKey = "createdAt-desc" | "createdAt-asc" | "name-asc" | "name-desc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "updatedAt" | "name"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "name-asc": { sortBy: "name", sortOrder: "asc" },
  "name-desc": { sortBy: "name", sortOrder: "desc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

export default async function StatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const sort: SortKey = isSortKey(resolvedSearchParams.sort || "") ? (resolvedSearchParams.sort as SortKey) : "createdAt-desc"
  const { sortBy, sortOrder } = SORT_MAP[sort]

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value || ""

  const listSet = {
    activeRoleId,
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
  }

  const [listResult, countResult] = await Promise.all([
    gets(listSet, STATE_PROJECTION),
    count({ activeRoleId, ...(search ? { name: search } : {}) }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as State[]
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/states?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/states?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <StatesClient
      items={items}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      total={total}
      search={search}
      sort={sort}
    />
  )
}
