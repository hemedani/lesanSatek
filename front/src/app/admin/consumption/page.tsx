import { cookies } from "next/headers"
import { gets } from "@/app/actions/consumption/gets"
import { count } from "@/app/actions/consumption/count"
import { ConsumptionClient } from "./consumption-client"
import type { ConsumptionRecord } from "./consumption-client"

const LIMIT = 20

const CONSUMPTION_PROJECTION = {
  _id: 1,
  quantity: 1,
  consumedAt: 1,
  reason: 1,
  consumedFor: 1,
  notes: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1, type: 1 },
  consumedBy: { _id: 1, first_name: 1, last_name: 1 },
  inventory: { _id: 1, quantity: 1 },
  ware: { _id: 1, name: 1, enName: 1, brand: 1 },
  wareModel: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

type SortKey = "consumedAt-desc" | "consumedAt-asc" | "quantity-desc" | "quantity-asc" | "createdAt-desc"
const SORT_MAP: Record<SortKey, { sortBy: "consumedAt" | "quantity" | "createdAt"; sortOrder: "asc" | "desc" }> = {
  "consumedAt-desc": { sortBy: "consumedAt", sortOrder: "desc" },
  "consumedAt-asc": { sortBy: "consumedAt", sortOrder: "asc" },
  "quantity-desc": { sortBy: "quantity", sortOrder: "desc" },
  "quantity-asc": { sortBy: "quantity", sortOrder: "asc" },
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

export default async function ConsumptionPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; reason?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const reason = (resolvedSearchParams.reason || "").trim() || undefined
  const sort: SortKey = isSortKey(resolvedSearchParams.sort || "") ? (resolvedSearchParams.sort as SortKey) : "consumedAt-desc"
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
    gets(listSet, CONSUMPTION_PROJECTION),
    count({ activeRoleId, ...(reason ? { reason } : {}) }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as ConsumptionRecord[]
  const total = countResult.success ? countResult.body?.qty ?? items.length : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (reason) params.set("reason", reason)
  if (sort !== "consumedAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/consumption?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/consumption?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <ConsumptionClient
      items={items}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      total={total}
      reason={reason || ""}
      sort={sort}
    />
  )
}