import { PageHeader } from "@/components/ui/page-header"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { cookies } from "next/headers"
import { getUser } from "@/app/actions/user/getUser"
import { RequestsClient } from "./requests-client"

interface PRItem {
  _id: string
  title?: string
  quantity?: number
  status?: string
  currentStep?: string
  createdAt?: string
  requester?: { _id: string; first_name?: string; last_name?: string }
  process?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
}

export default async function UnitHeadRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : undefined

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
    { page, limit, unitId, search, status },
    {
      _id: 1,
      title: 1,
      quantity: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
      requester: { _id: 1, first_name: 1, last_name: 1 },
      process: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
    },
  )

  const items: PRItem[] = result.success ? result.body || [] : []

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/unit-head/requests?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = items.length >= limit ? `/unit-head/requests?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

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
        search={search || ""}
        statusFilter={status || ""}
      />
    </div>
  )
}
