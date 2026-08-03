import { cookies } from "next/headers"
import { gets } from "@/app/actions/inventory/gets"
import { count } from "@/app/actions/inventory/count"
import { InventoryClient } from "./inventory-client"
import type { Inventory } from "./inventory-client"

const LIMIT = 20

const INVENTORY_PROJECTION = {
  _id: 1,
  quantity: 1,
  minQuantity: 1,
  maxQuantity: 1,
  batchNo: 1,
  expirationDate: 1,
  location: 1,
  lastCountedAt: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1, type: 1 },
  warehouseUnit: { _id: 1, name: 1, type: 1 },
  ware: { _id: 1, name: 1, enName: 1, brand: 1 },
  wareModel: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

type SortKey = "createdAt-desc" | "createdAt-asc" | "quantity-asc" | "quantity-desc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "quantity"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "quantity-asc": { sortBy: "quantity", sortOrder: "asc" },
  "quantity-desc": { sortBy: "quantity", sortOrder: "desc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

export default async function InventoryPage({
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
    gets(listSet, INVENTORY_PROJECTION),
    count({}),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as Inventory[]
  const total = countResult.success ? countResult.body?.qty ?? items.length : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/inventory?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/inventory?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <InventoryClient
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
