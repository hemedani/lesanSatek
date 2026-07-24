import { PageHeader } from "@/components/ui/page-header"
import { getPendingByUnit } from "@/app/actions/purchasingRequest/getPendingByUnit"
import { PendingClient } from "./pending-client"

interface PendingPRItem {
  _id: string
  title?: string
  description?: string
  quantity?: number
  status?: string
  currentStep?: number
  createdAt?: string
  requester?: { _id?: string; first_name?: string; last_name?: string }
  process?: {
    _id?: string
    name?: string
    steps?: {
      _id?: string
      name?: string
      order?: number
      stepType?: string
      assigneeGroups?: { operator?: string; unitIds?: string[] }[]
      approvals?: {
        _id?: string
        status?: string
        comment?: string
        decidedAt?: string
        unit?: { _id?: string; name?: string; head?: { _id?: string; first_name?: string; last_name?: string } }
        decidedBy?: { _id?: string; first_name?: string; last_name?: string }
      }[]
    }[]
  }
  stepApprovals?: {
    _id?: string
    status?: string
    comment?: string
    processStep?: { _id?: string; name?: string }
    unit?: { _id?: string; name?: string }
    decidedBy?: { _id?: string; first_name?: string; last_name?: string }
  }[]
}

export default async function PendingApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getPendingByUnit(
    { page, limit },
    {
      _id: 1,
      title: 1,
      description: 1,
      quantity: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
      requester: { _id: 1, first_name: 1, last_name: 1 },
      process: {
        _id: 1, name: 1,
        steps: {
          _id: 1, name: 1, order: 1, stepType: 1,
          assigneeGroups: 1,
        },
      },
      stepApprovals: {
        _id: 1, status: 1, comment: 1,
        processStep: { _id: 1, name: 1 },
        unit: { _id: 1, name: 1 },
        decidedBy: { _id: 1, first_name: 1, last_name: 1 },
      },
    },
  )

  const items: PendingPRItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/unit-head/requests/pending?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/unit-head/requests/pending?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="نیازمند تایید"
        description="درخواست‌های خریدی که نیاز به تایید شما دارند"
      />
      <PendingClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
      />
    </div>
  )
}
