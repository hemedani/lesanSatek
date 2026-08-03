import { cookies } from "next/headers"
import { gets } from "@/app/actions/purchasingRequest/gets"
import { count } from "@/app/actions/purchasingRequest/count"
import { PurchasingRequestsClient } from "./purchasing-requests-client"
import type { PurchasingRequest } from "./purchasing-requests-client"

const LIMIT = 20

const PR_PROJECTION = {
  _id: 1,
  title: 1,
  description: 1,
  status: 1,
  currentStep: 1,
  quantity: 1,
  estimatedAmount: 1,
  selectionType: 1,
  stuffStatus: 1,
  createdAt: 1,
  process: { _id: 1, name: 1 },
  requester: { _id: 1, first_name: 1, last_name: 1 },
  requestingUnit: { _id: 1, name: 1 },
  wareModel: { _id: 1, name: 1 },
} as const

type SortKey =
  | "createdAt-desc"
  | "createdAt-asc"
  | "title-asc"
  | "title-desc"
  | "status-asc"
  | "amount-desc"
  | "amount-asc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "title" | "status" | "amount"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "title-asc": { sortBy: "title", sortOrder: "asc" },
  "title-desc": { sortBy: "title", sortOrder: "desc" },
  "status-asc": { sortBy: "status", sortOrder: "asc" },
  "amount-desc": { sortBy: "amount", sortOrder: "desc" },
  "amount-asc": { sortBy: "amount", sortOrder: "asc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

type PrStatus = "Draft" | "Pending" | "InProgress" | "Approved" | "PendingFinalization" | "Rejected" | "Completed" | "Cancelled"

const VALID_STATUSES: PrStatus[] = [
  "Draft",
  "Pending",
  "InProgress",
  "Approved",
  "PendingFinalization",
  "Rejected",
  "Completed",
  "Cancelled",
]

export default async function PurchasingRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const status: PrStatus | "" = VALID_STATUSES.includes(resolvedSearchParams.status as PrStatus)
    ? (resolvedSearchParams.status as PrStatus)
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
    ...(search ? { title: search } : {}),
    ...(status ? { status } : {}),
  }

  const totalSet = {
    activeRoleId,
    ...(status ? { status } : {}),
  }

  const [listResult, countResult] = await Promise.all([
    gets(listSet, PR_PROJECTION),
    search
      ? gets({ ...listSet, page: 1, limit: 100 }, { _id: 1 })
      : count(totalSet),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as PurchasingRequest[]
  const all = (countResult.success ? countResult.body || [] : []) as { _id: string }[]
  const total = search
    ? (countResult.success ? all.length : items.length)
    : (countResult.success && typeof all === "object" && all && "qty" in all
      ? (all as unknown as { qty: number }).qty
      : items.length)
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/purchasing-requests?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/purchasing-requests?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <PurchasingRequestsClient
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
