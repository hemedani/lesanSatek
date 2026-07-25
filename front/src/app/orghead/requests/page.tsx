import { gets } from "@/app/actions/purchasingRequest/gets"
import { RequestsClient } from "./requests-client"

interface PageProps {
  searchParams: Promise<{ tab?: string; page?: string }>
}

export default async function OrgHeadRequestsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const tab = resolvedSearchParams.tab || "pending"
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 30

  const statusFilter = tab === "pending" ? "PendingFinalization" : tab === "completed" ? "Completed" : undefined

  const result = await gets(
    { activeRoleId: "", page, limit, ...(statusFilter ? { status: statusFilter } : {}) },
    {
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
    }
  )

  const items = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/orghead/requests?tab=${tab}&page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/orghead/requests?tab=${tab}&page=${page + 1}` : ""

  return (
    <RequestsClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      activeTab={tab}
    />
  )
}
