import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { Button } from "@/components/ui/button"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { count as countPRs } from "@/app/actions/purchasingRequest/count"
import { gets as getProcesses } from "@/app/actions/process/gets"
import { getMe } from "@/app/actions/user/getMe"
import type { ReqType } from "@/types/declarations/selectInp"
import { MyRequestsClient } from "./my-requests-client"
import type { MyRequestCounts } from "./my-requests-client"
import type { PRItem, ProcessOption } from "../requests-client"

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

export default async function MyRequestsPage({
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

  const meRes = await getMe({ _id: 1 })
  const meId = meRes.success && meRes.body?._id ? (meRes.body._id as string) : ""
  const meFilter = meId ? { requesterId: meId } : {}

  const listSet = {
    page,
    limit: LIMIT,
    sortBy: "createdAt" as const,
    sortOrder: sort,
    ...meFilter,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(processId ? { processId } : {}),
  }
  const countSet = {
    ...meFilter,
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
  ] = await Promise.all([
    getPRs(listSet, PR_PROJECTION),
    getProcesses({ page: 1, limit: 200 }, { _id: 1, name: 1, status: 1 }),
    countPRs(countSet, { qty: 1 }),
    countPRs(meFilter, { qty: 1 }),
    countPRs({ ...meFilter, status: "Draft" }, { qty: 1 }),
    countPRs({ ...meFilter, status: "Pending" }, { qty: 1 }),
    countPRs({ ...meFilter, status: "InProgress" }, { qty: 1 }),
    countPRs({ ...meFilter, status: "Approved" }, { qty: 1 }),
  ])

  const items = (prsResult.success ? prsResult.body || [] : []) as PRItem[]
  const processes = (processesResult.success ? processesResult.body || [] : []) as ProcessOption[]
  const activeProcesses = processes.filter((p) => p?.status !== "deactivated")
  const filteredTotal = filteredCountResult.success
    ? (filteredCountResult.body?.qty ?? items.length)
    : items.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / LIMIT))

  const counts: MyRequestCounts = {
    total: totalCountResult.success ? (totalCountResult.body?.qty ?? 0) : 0,
    draft: draftCountResult.success ? (draftCountResult.body?.qty ?? 0) : 0,
    pending:
      (pendingCountResult.success ? (pendingCountResult.body?.qty ?? 0) : 0) +
      (inProgressCountResult.success ? (inProgressCountResult.body?.qty ?? 0) : 0),
    approved: approvedCountResult.success ? (approvedCountResult.body?.qty ?? 0) : 0,
  }

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  if (processId) params.set("processId", processId)
  if (sort === "asc") params.set("sort", "asc")
  const qs = params.toString()

  const prevPageUrl =
    page > 1 ? `/requests/my-requests?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl =
    page < totalPages ? `/requests/my-requests?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="درخواست‌های من"
        description="درخواست‌های خریدی که خودتان ثبت کرده‌اید — وضعیت، فرآیند و مراحل را دنبال کنید"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/requests">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              همه درخواست‌ها
            </Button>
          </Link>
          <Link href="/requests/new">
            <Button className="gap-2 px-5">
              <Plus className="size-5" />
              ثبت درخواست جدید
            </Button>
          </Link>
          <HelpLauncher topicId="requests-my-requests" tooltip="راهنمای درخواست‌های من" />
        </div>
      </PageHeader>

      <MyRequestsClient
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
