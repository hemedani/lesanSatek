import { cookies } from "next/headers"
import { gets as getCities } from "@/app/actions/city/gets"
import { count } from "@/app/actions/city/count"
import { gets as getStates } from "@/app/actions/state/gets"
import { CitiesClient } from "./cities-client"
import type { City, State } from "./cities-client"

const LIMIT = 20

const CITY_PROJECTION = {
  _id: 1,
  name: 1,
  enName: 1,
  createdAt: 1,
  state: { _id: 1, name: 1 },
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

export default async function CitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string; stateId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const sort: SortKey = isSortKey(resolvedSearchParams.sort || "") ? (resolvedSearchParams.sort as SortKey) : "createdAt-desc"
  const { sortBy, sortOrder } = SORT_MAP[sort]
  const stateId = typeof resolvedSearchParams.stateId === "string" ? resolvedSearchParams.stateId : ""

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value || ""

  const listSet = {
    activeRoleId,
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(stateId ? { stateId } : {}),
  }

  const [listResult, countResult, statesResult] = await Promise.all([
    getCities(listSet, CITY_PROJECTION),
    count({ activeRoleId, ...(search ? { name: search } : {}) }),
    getStates({ activeRoleId, page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }, { _id: 1, name: 1 }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as City[]
  const states = (statesResult.success ? statesResult.body || [] : []) as State[]
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  if (stateId) params.set("stateId", stateId)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/cities?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/cities?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <CitiesClient
      items={items}
      states={states}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      total={total}
      search={search}
      sort={sort}
      stateId={stateId}
    />
  )
}
