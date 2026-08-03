import { cookies } from "next/headers"
import { gets } from "@/app/actions/goodsReceipt/gets"
import { GoodsReceiptsClient } from "./goods-receipts-client"
import type { GoodsReceipt } from "./goods-receipts-client"

const LIMIT = 20

const GR_PROJECTION = {
  _id: 1,
  receiptNumber: 1,
  description: 1,
  status: 1,
  receivedAt: 1,
  notes: 1,
  items: 1,
  createdAt: 1,
  purchasingRequest: { _id: 1, title: 1 },
} as const

type SortKey =
  | "createdAt-desc"
  | "createdAt-asc"
  | "receiptNumber-asc"
  | "receiptNumber-desc"
  | "receivedAt-asc"
  | "receivedAt-desc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "receiptNumber" | "receivedAt"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "receiptNumber-asc": { sortBy: "receiptNumber", sortOrder: "asc" },
  "receiptNumber-desc": { sortBy: "receiptNumber", sortOrder: "desc" },
  "receivedAt-asc": { sortBy: "receivedAt", sortOrder: "asc" },
  "receivedAt-desc": { sortBy: "receivedAt", sortOrder: "desc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

type GrStatus = "pending" | "completed" | "partially_rejected"
const VALID_STATUSES: GrStatus[] = ["pending", "completed", "partially_rejected"]

export default async function GoodsReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const status: GrStatus | "" = VALID_STATUSES.includes(resolvedSearchParams.status as GrStatus)
    ? (resolvedSearchParams.status as GrStatus)
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
    ...(search ? { receiptNumber: search } : {}),
    ...(status ? { status } : {}),
  }

  const [listResult, allResult] = await Promise.all([
    gets(listSet, GR_PROJECTION),
    gets({ activeRoleId, page: 1, limit: 500, sortBy, sortOrder, ...(status ? { status } : {}) }, { _id: 1 }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as GoodsReceipt[]
  const all = (allResult.success ? allResult.body || [] : []) as { _id: string }[]
  const total = search ? items.length : all.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/goods-receipts?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/goods-receipts?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <GoodsReceiptsClient
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
