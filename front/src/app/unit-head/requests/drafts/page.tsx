import { PageHeader } from "@/components/ui/page-header"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { cookies } from "next/headers"
import { getUser } from "@/app/actions/user/getUser"
import { DraftsClient } from "./drafts-client"

interface DraftItem {
  _id: string
  title?: string
  quantity?: number
  status?: string
  createdAt?: string
  requester?: { _id: string; first_name?: string; last_name?: string }
  wareModel?: { _id: string; name?: string }
}

export default async function DraftsPage({
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
    { page, limit, unitId, status: "Draft" },
    {
      _id: 1,
      title: 1,
      quantity: 1,
      status: 1,
      createdAt: 1,
      requester: { _id: 1, first_name: 1, last_name: 1 },
      wareModel: { _id: 1, name: 1 },
    },
  )

  const items: DraftItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/unit-head/requests/drafts?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/unit-head/requests/drafts?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="پیش‌نویس‌ها"
        description="درخواست‌های خرید در وضعیت پیش‌نویس"
      />
      <DraftsClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
      />
    </div>
  )
}
