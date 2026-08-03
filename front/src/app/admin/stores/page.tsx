import { cookies } from "next/headers"
import { gets } from "@/app/actions/store/gets"
import { count } from "@/app/actions/store/count"
import { StoresClient } from "./stores-client"
import type { Store } from "./stores-client"

const LIMIT = 20

const STORE_PROJECTION = {
  _id: 1,
  name: 1,
  status: 1,
  score: 1,
  address: 1,
  ceoname: 1,
  storeType: 1,
  createdAt: 1,
  storeHead: { _id: 1, first_name: 1, last_name: 1 },
  city: { _id: 1, name: 1 },
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

export default async function StoresPage({
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
    gets(listSet, STORE_PROJECTION),
    count({ activeRoleId, ...(search ? { name: search } : {}) }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as Store[]
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/stores?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/stores?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <StoresClient
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
