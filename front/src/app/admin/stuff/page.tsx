import { cookies } from "next/headers"
import { gets } from "@/app/actions/stuff/gets"
import { StuffClient } from "./stuff-client"
import type { Stuff } from "./stuff-client"

const LIMIT = 20

const STUFF_PROJECTION = {
  _id: 1,
  quantity: 1,
  price: 1,
  hasAbsolutePrice: 1,
  pricePercentage: 1,
  expiration: 1,
  barcode: 1,
  qrc: 1,
  isExpirationNear: 1,
  createdAt: 1,
  ware: { _id: 1, name: 1, enName: 1, brand: 1, photoUrl: 1 },
  store: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareModel: { _id: 1, name: 1 },
} as const

type SortKey = "createdAt-desc" | "createdAt-asc" | "quantity-desc" | "quantity-asc" | "price-desc" | "price-asc" | "expiration-asc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "quantity" | "price" | "expiration"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "quantity-desc": { sortBy: "quantity", sortOrder: "desc" },
  "quantity-asc": { sortBy: "quantity", sortOrder: "asc" },
  "price-desc": { sortBy: "price", sortOrder: "desc" },
  "price-asc": { sortBy: "price", sortOrder: "asc" },
  "expiration-asc": { sortBy: "expiration", sortOrder: "asc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

export default async function StuffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = (resolvedSearchParams.search || "").trim()
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
    gets(listSet, STUFF_PROJECTION),
    gets(
      { activeRoleId, page: 1, limit: 500, ...(search ? { search } : {}) },
      { _id: 1 },
    ),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as Stuff[]
  const total = countResult.success ? (countResult.body || []).length : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/stuff?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/stuff?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <StuffClient
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