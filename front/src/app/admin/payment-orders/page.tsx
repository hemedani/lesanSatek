import { cookies } from "next/headers"
import { gets } from "@/app/actions/paymentOrder/gets"
import { PaymentOrdersClient } from "./payment-orders-client"
import type { PaymentOrder } from "./payment-orders-client"

const LIMIT = 20

const PO_PROJECTION = {
  _id: 1,
  title: 1,
  amount: 1,
  description: 1,
  status: 1,
  paidAt: 1,
  createdAt: 1,
  purchasingRequest: { _id: 1, title: 1 },
  payTo: { _id: 1, name: 1 },
} as const

type SortKey =
  | "createdAt-desc"
  | "createdAt-asc"
  | "amount-asc"
  | "amount-desc"
  | "paidAt-asc"
  | "paidAt-desc"
  | "title-asc"
  | "title-desc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "amount" | "paidAt" | "title"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "amount-asc": { sortBy: "amount", sortOrder: "asc" },
  "amount-desc": { sortBy: "amount", sortOrder: "desc" },
  "paidAt-asc": { sortBy: "paidAt", sortOrder: "asc" },
  "paidAt-desc": { sortBy: "paidAt", sortOrder: "desc" },
  "title-asc": { sortBy: "title", sortOrder: "asc" },
  "title-desc": { sortBy: "title", sortOrder: "desc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

type PoStatus = "draft" | "sent_to_finance" | "paid" | "cancelled"
const VALID_STATUSES: PoStatus[] = ["draft", "sent_to_finance", "paid", "cancelled"]

export default async function PaymentOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const status: PoStatus | "" = VALID_STATUSES.includes(resolvedSearchParams.status as PoStatus)
    ? (resolvedSearchParams.status as PoStatus)
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
    ...(status ? { status } : {}),
  }

  const [listResult, allResult] = await Promise.all([
    gets(listSet, PO_PROJECTION),
    gets({ activeRoleId, page: 1, limit: 500, sortBy, sortOrder, ...(status ? { status } : {}) }, { _id: 1 }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as PaymentOrder[]
  const all = (allResult.success ? allResult.body || [] : []) as { _id: string }[]
  const total = search ? items.length : all.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/payment-orders?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/payment-orders?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <PaymentOrdersClient
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
