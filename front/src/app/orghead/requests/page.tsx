import { gets } from "@/app/actions/purchasingRequest/gets"
import { count as countPRs } from "@/app/actions/purchasingRequest/count"
import { gets as getPaymentOrders } from "@/app/actions/paymentOrder/gets"
import { gets as getProcesses } from "@/app/actions/process/gets"
import type { ReqType } from "@/types/declarations/selectInp"
import { RequestsClient } from "./requests-client"
import type { ProcessOption, RequestCounts } from "./requests-client"

interface PageProps {
  searchParams: Promise<{
    tab?: string
    page?: string
    search?: string
    status?: string
    processId?: string
    sort?: string
  }>
}

type PRStatus = NonNullable<ReqType["main"]["purchasingRequest"]["gets"]["set"]["status"]>;

const PROJECTION = {
  _id: 1,
  title: 1,
  status: 1,
  quantity: 1,
  estimatedAmount: 1,
  selectionType: 1,
  stuffStatus: 1,
  selectedTenderOfferId: 1,
  finalizedAt: 1,
  completedAt: 1,
  createdAt: 1,
  requestingUnit: { _id: 1, name: 1 },
  requester: { _id: 1, first_name: 1, last_name: 1 },
  wareModel: { _id: 1, name: 1 },
  process: { _id: 1, name: 1 },
  organization: { _id: 1, name: 1 },
} as const;

const TAB_KEYS = ["pending", "payment", "completed", "all"] as const;
const STATUS_BY_TAB: Record<string, PRStatus> = {
  pending: "PendingFinalization",
  completed: "Completed",
};

export default async function OrgHeadRequestsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const tab =
    (TAB_KEYS as readonly string[]).includes(resolvedSearchParams.tab || "")
      ? (resolvedSearchParams.tab as (typeof TAB_KEYS)[number])
      : "pending"
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 30
  const search = resolvedSearchParams.search || ""
  const status = (
    ["Draft", "Pending", "InProgress", "Approved", "PendingFinalization", "Rejected", "Completed", "Cancelled"] as PRStatus[]
  ).includes(resolvedSearchParams.status as PRStatus)
    ? resolvedSearchParams.status as PRStatus
    : ""
  const processId = resolvedSearchParams.processId || ""
  const sort: "asc" | "desc" = resolvedSearchParams.sort === "asc" ? "asc" : "desc"

  const baseFilter = {
    page,
    limit,
    sortBy: "createdAt" as const,
    sortOrder: sort,
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(processId ? { processId } : {}),
  }

  let items: any[] = []
  let paymentOrdersByPRId: Record<string, { _id: string; title?: string; amount?: number; status?: string }> = {}

  if (tab === "payment") {
    const [prResult, poResult] = await Promise.all([
      gets({ ...baseFilter, stuffStatus: "received", page, limit }, PROJECTION as any),
      getPaymentOrders(
        { activeRoleId: "", page: 1, limit: 200, status: "draft" },
        { _id: 1, title: 1, amount: 1, status: 1, purchasingRequest: { _id: 1 } },
      ),
    ])

    const allPRs = prResult.success ? prResult.body || [] : []
    const draftPOs = poResult.success ? poResult.body || [] : []

    for (const po of draftPOs) {
      if (po.purchasingRequest?._id) {
        paymentOrdersByPRId[po.purchasingRequest._id] = { _id: po._id, title: po.title, amount: po.amount, status: po.status }
      }
    }

    items = allPRs.filter((pr: any) => paymentOrdersByPRId[pr._id])
  } else {
    const statusFilter = status || STATUS_BY_TAB[tab]
    const result = await gets(
      { activeRoleId: "", page, limit, ...(statusFilter ? { status: statusFilter } : {}), ...(search ? { search } : {}), ...(processId ? { processId } : {}) },
      PROJECTION as any,
    )

    items = result.success ? result.body || [] : []
  }

  const filteredTotal = tab === "payment"
    ? await countPRs({ ...(search ? { search } : {}), ...(processId ? { processId } : {}), stuffStatus: "received" }, { qty: 1 })
    : await (() => {
        const countStatusFilter: PRStatus | "" = status || STATUS_BY_TAB[tab] || ""
        return countPRs(
          { ...(search ? { search } : {}), ...(processId ? { processId } : {}), ...(countStatusFilter ? { status: countStatusFilter } : {}) },
          { qty: 1 },
        )
      })()

  const totalPages = Math.max(1, Math.ceil((filteredTotal.success ? (filteredTotal.body?.qty ?? items.length) : items.length) / limit))

  const [processesResult, totalCountResult, pendingCountResult, paymentCountResult, completedCountResult] = await Promise.all([
    getProcesses({ page: 1, limit: 200 }, { _id: 1, name: 1, status: 1 }),
    countPRs({}, { qty: 1 }),
    countPRs({ status: "PendingFinalization" }, { qty: 1 }),
    countPRs({ stuffStatus: "received" }, { qty: 1 }),
    countPRs({ status: "Completed" }, { qty: 1 }),
  ])

  const processes = (processesResult.success ? processesResult.body || [] : []).filter((p: any) => p?.status !== "deactivated")
  const counts: RequestCounts = {
    total: totalCountResult.success ? totalCountResult.body?.qty ?? 0 : 0,
    totalPending: pendingCountResult.success ? pendingCountResult.body?.qty ?? 0 : 0,
    payment: paymentCountResult.success ? paymentCountResult.body?.qty ?? 0 : 0,
    completed: completedCountResult.success ? completedCountResult.body?.qty ?? 0 : 0,
  }

  const params = new URLSearchParams()
params.set("tab", tab)
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  if (processId) params.set("processId", processId)
  if (sort === "asc") params.set("sort", "asc")
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/orghead/requests?${qs}&page=${page - 1}` : ""
  const nextPageUrl = page < totalPages ? `/orghead/requests?${qs}&page=${page + 1}` : ""

  return (
    <RequestsClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      activeTab={tab}
      totalPages={totalPages}
      counts={counts}
      processes={processes}
      search={search}
      status={status}
      processId={processId}
      sort={sort}
      paymentOrdersByPRId={paymentOrdersByPRId}
    />
  )
}