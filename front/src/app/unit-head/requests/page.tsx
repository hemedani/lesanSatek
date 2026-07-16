import { PageHeader } from "@/components/ui/page-header"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { cookies } from "next/headers"
import { getUser } from "@/app/actions/user/getUser"
import { RequestsClient } from "./requests-client"

interface PRItem {
  _id: string
  title?: string
  estimatedAmount?: number
  quantity?: number
  status?: string
  currentStep?: string
  createdAt?: string
  requester?: { _id: string; first_name?: string; last_name?: string }
}

export default async function UnitHeadRequestsPage({
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

  const result = await getPRs(
    { page, limit, ...(unitId ? { unitId } : {}) },
    {
      _id: 1,
      title: 1,
      estimatedAmount: 1,
      quantity: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
      requester: { _id: 1, first_name: 1, last_name: 1 },
    },
  )

  const items: PRItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/unit-head/requests?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/unit-head/requests?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="درخواست‌های خرید"
        description="لیست درخواست‌های خرید نیازمند بررسی"
      />

      <RequestsClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
      />
    </div>
  )
}
