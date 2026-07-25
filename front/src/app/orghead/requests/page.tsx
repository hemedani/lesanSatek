import { gets } from "@/app/actions/purchasingRequest/gets"
import { gets as getPaymentOrders } from "@/app/actions/paymentOrder/gets"
import { RequestsClient } from "./requests-client"

interface PageProps {
  searchParams: Promise<{ tab?: string; page?: string }>
}

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
  wareModel: { _id: 1, name: 1 },
  organization: { _id: 1, name: 1 },
} as const;

export default async function OrgHeadRequestsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const tab = resolvedSearchParams.tab || "pending"
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 30

  let items: any[] = []
  let paymentOrdersByPRId: Record<string, { _id: string; title?: string; amount?: number; status?: string }> = {}

  if (tab === "payment") {
    const [prResult, poResult] = await Promise.all([
      gets(
        { activeRoleId: "", page, limit, stuffStatus: "received" },
        PROJECTION as any,
      ),
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
    const statusFilter = tab === "pending" ? "PendingFinalization" : tab === "completed" ? "Completed" : undefined

    const result = await gets(
      { activeRoleId: "", page, limit, ...(statusFilter ? { status: statusFilter } : {}) },
      PROJECTION as any,
    )

    items = result.success ? result.body || [] : []
  }

  const prevPageUrl = page > 1 ? `/orghead/requests?tab=${tab}&page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/orghead/requests?tab=${tab}&page=${page + 1}` : ""

  return (
    <RequestsClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      activeTab={tab}
      paymentOrdersByPRId={paymentOrdersByPRId}
    />
  )
}
