import { cookies } from "next/headers"
import { gets } from "@/app/actions/stockMovement/gets"
import { count } from "@/app/actions/stockMovement/count"
import { StockMovementsClient } from "./stock-movements-client"
import type { StockMovement } from "./stock-movements-client"

const LIMIT = 20

const MOVEMENT_PROJECTION = {
  _id: 1,
  quantity: 1,
  balanceBefore: 1,
  balanceAfter: 1,
  reason: 1,
  referenceType: 1,
  description: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1, type: 1 },
  createdBy: { _id: 1, first_name: 1, last_name: 1 },
  store: { _id: 1, name: 1 },
  ware: { _id: 1, name: 1, enName: 1, brand: 1 },
  wareModel: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

type MoveReason = "goods_receipt" | "goods_issue" | "transfer_in" | "transfer_out" | "consumption" | "adjustment" | "return" | "write_off"
const REASONS: MoveReason[] = ["goods_receipt", "goods_issue", "transfer_in", "transfer_out", "consumption", "adjustment", "return", "write_off"]

type SortKey = "createdAt-desc" | "createdAt-asc" | "quantity-desc" | "quantity-asc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "quantity"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "quantity-desc": { sortBy: "quantity", sortOrder: "desc" },
  "quantity-asc": { sortBy: "quantity", sortOrder: "asc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

export default async function StockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; reason?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const reason: MoveReason | "" = REASONS.includes(resolvedSearchParams.reason as MoveReason)
    ? (resolvedSearchParams.reason as MoveReason)
    : ""
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
    ...(reason ? { reason } : {}),
  }

  const [listResult, countResult] = await Promise.all([
    gets(listSet, MOVEMENT_PROJECTION),
    count({ activeRoleId, ...(reason ? { reason } : {}) }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as StockMovement[]
  const total = countResult.success ? countResult.body?.qty ?? items.length : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (reason) params.set("reason", reason)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/stock-movements?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/stock-movements?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <StockMovementsClient
      items={items}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      total={total}
      reason={reason}
      sort={sort}
    />
  )
}
