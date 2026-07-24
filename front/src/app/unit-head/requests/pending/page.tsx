import { PageHeader } from "@/components/ui/page-header"
import { gets as getApprovals } from "@/app/actions/stepApproval/gets"
import { cookies } from "next/headers"
import { getUser } from "@/app/actions/user/getUser"
import { PendingClient } from "./pending-client"

interface PendingApprovalItem {
  _id: string
  status?: string
  comment?: string
  createdAt?: string
  purchasingRequest?: {
    _id: string
    title?: string
    status?: string
    quantity?: number
    currentStep?: number
    requester?: { _id: string; first_name?: string; last_name?: string }
  }
  processStep?: {
    _id: string
    name?: string
    order?: number
  }
}

export default async function PendingApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let unitId: string | undefined

  if (activeRoleId) {
    const userRes = await getUser({}, {
      _id: 1,
      roles: { roleId: 1, scopeId: 1, scopeType: 1, name: 1 },
    }).catch(() => ({ success: false, body: null }))
    const user = userRes.success ? userRes.body : null
    const activeRole = user?.roles?.find((r: { roleId?: string }) => r.roleId === activeRoleId)
    if (activeRole?.scopeType === "unit" && activeRole.scopeId) {
      unitId = activeRole.scopeId
    }
  }

  const result = await getApprovals(
    { page, limit, unitId, status: "pending", activeRoleId: activeRoleId! },
    {
      _id: 1,
      status: 1,
      comment: 1,
      purchasingRequest: {
        _id: 1,
        title: 1,
        status: 1,
        quantity: 1,
        currentStep: 1,
        requester: { _id: 1, first_name: 1, last_name: 1 },
      },
      processStep: { _id: 1, name: 1, order: 1 },
    },
  )

  const items: PendingApprovalItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/unit-head/requests/pending?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/unit-head/requests/pending?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="نیازمند تایید"
        description="درخواست‌های خریدی که به واحد شما ارجاع شده‌اند"
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
