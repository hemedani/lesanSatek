import Link from "next/link"
import { Plus, User, Warehouse, ScrollText, Activity } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { count as countPRs } from "@/app/actions/purchasingRequest/count"
import { gets as getProcesses } from "@/app/actions/process/gets"
import type { ReqType } from "@/types/declarations/selectInp"
import { RequestsListClient } from "./requests-client"
import type { PRItem, ProcessOption } from "./requests-client"

const LIMIT = 12

const VALID_STATUSES: NonNullable<ReqType["main"]["purchasingRequest"]["gets"]["set"]["status"]>[] = [
  "Draft",
  "Pending",
  "InProgress",
  "Approved",
  "PendingFinalization",
  "Rejected",
  "Completed",
  "Cancelled",
]

const PR_PROJECTION = {
  _id: 1,
  title: 1,
  status: 1,
  currentStep: 1,
  quantity: 1,
  estimatedAmount: 1,
  createdAt: 1,
  requester: { _id: 1, first_name: 1, last_name: 1 },
  process: { _id: 1, name: 1, unit: { _id: 1, name: 1 } },
  wareModel: { _id: 1, name: 1 },
} as const

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams

  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const status =
    typeof resolvedSearchParams.status === "string" &&
    (VALID_STATUSES as readonly string[]).includes(resolvedSearchParams.status)
      ? (resolvedSearchParams.status as NonNullable<ReqType["main"]["purchasingRequest"]["gets"]["set"]["status"]>)
      : ""
  const processId = typeof resolvedSearchParams.processId === "string" ? resolvedSearchParams.processId : ""
  const sort: "asc" | "desc" = resolvedSearchParams.sort === "asc" ? "asc" : "desc"

  const [prsResult, processesResult, countResult] = await Promise.all([
    getPRs(
      {
        page,
        limit: LIMIT,
        sortBy: "createdAt",
        sortOrder: sort,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(processId ? { processId } : {}),
      },
      PR_PROJECTION,
    ),
    getProcesses({ page: 1, limit: 200 }, { _id: 1, name: 1, status: 1 }),
    countPRs(
      {
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(processId ? { processId } : {}),
      },
      { qty: 1 },
    ),
  ])

  const items = (prsResult.success ? prsResult.body || [] : []) as PRItem[]
  const processes = (processesResult.success ? processesResult.body || [] : []) as ProcessOption[]
  const activeProcesses = processes.filter((p) => p?.status !== "deactivated")
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  if (processId) params.set("processId", processId)
  if (sort === "asc") params.set("sort", "asc")
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/requests?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/requests?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="درخواست‌های خرید" description="ثبت، پیگیری و مدیریت درخواست‌های خرید سازمان">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/requests/my-requests">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <User className="size-4" />
              درخواست‌های من
            </Button>
          </Link>
          <Link href="/requests/inventory">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Warehouse className="size-4" />
              انبار واحد
            </Button>
          </Link>
          <Link href="/requests/consumption">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ScrollText className="size-4" />
              مصرف کالا
            </Button>
          </Link>
          <Link href="/requests/stock-movements">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <Activity className="size-4" />
              گردش کالا
            </Button>
          </Link>
          <Link href="/requests/new">
            <Button className="gap-1.5">
              <Plus className="size-4" />
              ثبت درخواست جدید
            </Button>
          </Link>
        </div>
      </PageHeader>

      <RequestsListClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        search={search}
        status={status}
        processId={processId}
        sort={sort}
        processes={activeProcesses}
      />
    </div>
  )
}
