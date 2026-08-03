import { cookies } from "next/headers"
import { gets } from "@/app/actions/ware/gets"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { count } from "@/app/actions/ware/count"
import { WaresClient } from "./wares-client"
import type { Ware } from "./wares-client"

const LIMIT = 20

const WARE_PROJECTION = {
  _id: 1,
  name: 1,
  enName: 1,
  brand: 1,
  price: 1,
  orderedNumber: 1,
  irc: 1,
  umdns: 1,
  gtin: 1,
  createdAt: 1,
  wareType: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareModel: { _id: 1, name: 1 },
  manufacturer: { _id: 1, name: 1 },
} as const

type SortKey = "createdAt-desc" | "createdAt-asc" | "name-asc" | "price-desc" | "price-asc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "updatedAt" | "name" | "price" | "brand"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "name-asc": { sortBy: "name", sortOrder: "asc" },
  "price-desc": { sortBy: "price", sortOrder: "desc" },
  "price-asc": { sortBy: "price", sortOrder: "asc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

export default async function WaresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string; wareTypeId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const sort: SortKey = isSortKey(resolvedSearchParams.sort || "") ? (resolvedSearchParams.sort as SortKey) : "createdAt-desc"
  const { sortBy, sortOrder } = SORT_MAP[sort]
  const wareTypeId = typeof resolvedSearchParams.wareTypeId === "string" ? resolvedSearchParams.wareTypeId : ""

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value || ""

  const listSet = {
    activeRoleId,
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(wareTypeId ? { wareTypeId } : {}),
  }

  const [listResult, typesResult, countResult] = await Promise.all([
    gets(listSet, WARE_PROJECTION),
    getWareTypes({ activeRoleId, page: 1, limit: 100 }, { _id: 1, name: 1 }),
    count({ activeRoleId, ...(search ? { name: search } : {}) }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as Ware[]
  const wareTypes = (typesResult.success ? typesResult.body || [] : []) as { _id: string; name?: string }[]
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  if (wareTypeId) params.set("wareTypeId", wareTypeId)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/wares?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/wares?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <WaresClient
      items={items}
      wareTypes={wareTypes}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      total={total}
      search={search}
      sort={sort}
      wareTypeId={wareTypeId}
    />
  )
}
