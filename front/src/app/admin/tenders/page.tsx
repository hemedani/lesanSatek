import { cookies } from "next/headers"
import { gets } from "@/app/actions/tender/gets"
import { count } from "@/app/actions/tender/count"
import { TendersClient } from "./tenders-client"
import type { Tender } from "./tenders-client"

const LIMIT = 20

const TENDER_PROJECTION = {
  _id: 1,
  title: 1,
  description: 1,
  status: 1,
  deadline: 1,
  createdAt: 1,
  purchasingRequest: { _id: 1, title: 1 },
} as const

type SortKey =
  | "createdAt-desc"
  | "createdAt-asc"
  | "title-asc"
  | "title-desc"
  | "deadline-asc"
  | "deadline-desc"
const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "title" | "deadline"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "title-asc": { sortBy: "title", sortOrder: "asc" },
  "title-desc": { sortBy: "title", sortOrder: "desc" },
  "deadline-asc": { sortBy: "deadline", sortOrder: "asc" },
  "deadline-desc": { sortBy: "deadline", sortOrder: "desc" },
}
function isSortKey(value: string): value is SortKey {
  return value in SORT_MAP
}

type TenderStatus = "open" | "closed" | "awarded" | "cancelled"
const VALID_STATUSES: TenderStatus[] = ["open", "closed", "awarded", "cancelled"]

export default async function TendersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const status: TenderStatus | "" = VALID_STATUSES.includes(resolvedSearchParams.status as TenderStatus)
    ? (resolvedSearchParams.status as TenderStatus)
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
    gets(listSet, TENDER_PROJECTION),
    search
      ? gets({ ...listSet, page: 1, limit: 100 }, { _id: 1 })
      : count(totalSet),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as Tender[]
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

  const prevPageUrl = page > 1 ? `/admin/tenders?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/tenders?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <TendersClient
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
