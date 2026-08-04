import { PageHeader } from "@/components/ui/page-header"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { count as countPRs } from "@/app/actions/purchasingRequest/count"
import { gets as getProcesses } from "@/app/actions/process/gets"
import { RequestsClient } from "./requests-client"
import type { PRItem, ProcessOption, RequestCounts } from "./requests-client"
import type { ReqType } from "@/types/declarations/selectInp"

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

export default async function UnitHeadRequestsPage({
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

  const listSet = {
    page,
    limit: LIMIT,
    sortBy: "createdAt" as const,
    sortOrder: sort,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(processId ? { processId } : {}),
  }
  const countSet = {
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(processId ? { processId } : {}),
  }

  const [
    prsResult,
    processesResult,
    filteredCountResult,
    totalCountResult,
    draftCountResult,
    pendingCountResult,
    inProgressCountResult,
    approvedCountResult,
    rejectedCountResult,
    cancelledCountResult,
  ] = await Promise.all([
    getPRs(listSet, {
      _id: 1,
      title: 1,
      quantity: 1,
      estimatedAmount: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
      requester: { _id: 1, first_name: 1, last_name: 1 },
      process: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
    }),
    getProcesses({ page: 1, limit: 200 }, { _id: 1, name: 1, status: 1 }),
    countPRs(countSet, { qty: 1 }),
    countPRs({}, { qty: 1 }),
    countPRs({ status: "Draft" }, { qty: 1 }),
    countPRs({ status: "Pending" }, { qty: 1 }),
    countPRs({ status: "InProgress" }, { qty: 1 }),
    countPRs({ status: "Approved" }, { qty: 1 }),
    countPRs({ status: "Rejected" }, { qty: 1 }),
    countPRs({ status: "Cancelled" }, { qty: 1 }),
  ])

  const items = (prsResult.success ? prsResult.body || [] : []) as PRItem[]
  const processes = (processesResult.success ? processesResult.body || [] : []) as ProcessOption[]
  const activeProcesses = processes.filter((p) => p?.status !== "deactivated") as ProcessOption[]
  const filteredTotal = filteredCountResult.success ? (filteredCountResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / LIMIT))

  const counts: RequestCounts = {
    total: totalCountResult.success ? (totalCountResult.body?.qty ?? 0) : 0,
    draft: draftCountResult.success ? (draftCountResult.body?.qty ?? 0) : 0,
    pending:
      (pendingCountResult.success ? (pendingCountResult.body?.qty ?? 0) : 0) +
      (inProgressCountResult.success ? (inProgressCountResult.body?.qty ?? 0) : 0),
    approved: approvedCountResult.success ? (approvedCountResult.body?.qty ?? 0) : 0,
    rejected:
      (rejectedCountResult.success ? (rejectedCountResult.body?.qty ?? 0) : 0) +
      (cancelledCountResult.success ? (cancelledCountResult.body?.qty ?? 0) : 0),
  }

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  if (processId) params.set("processId", processId)
  if (sort === "asc") params.set("sort", "asc")
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/unit-head/requests?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/unit-head/requests?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="همه درخواست‌ها"
        description="لیست کامل درخواست‌های خرید واحد"
      />
      <RequestsClient
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
        counts={counts}
      />
    </div>
  )
}