import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { EmptyState } from "@/components/ui/empty-state"
import { cookies } from "next/headers"
import { getUser } from "@/app/actions/user/getUser"

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

const statusMap: Record<string, string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار تایید",
  approved: "تایید شده",
  rejected: "رد شده",
  in_progress: "در حال انجام",
  completed: "تکمیل شده",
}

const columns = [
  {
    key: "title",
    label: "عنوان",
    render: (item: PRItem) => (
      <Link href={`/unit-head/requests/${item._id}`} className="text-frost-link hover:underline font-medium">
        {item.title || "—"}
      </Link>
    ),
  },
  { key: "estimatedAmount", label: "مبلغ تخمینی", render: (item: PRItem) => `${item.estimatedAmount?.toLocaleString("fa-IR") || "—"} تومان` },
  { key: "quantity", label: "تعداد", render: (item: PRItem) => item.quantity?.toLocaleString("fa-IR") || "—" },
  {
    key: "status",
    label: "وضعیت",
    render: (item: PRItem) => (
      <StatusBadge status={item.status || "draft"} labelMap={statusMap} />
    ),
  },
  {
    key: "requester",
    label: "درخواست‌دهنده",
    render: (item: PRItem) =>
      item.requester ? `${item.requester.first_name || ""} ${item.requester.last_name || ""}`.trim() || "—" : "—",
  },
  { key: "currentStep", label: "مرحله جاری", render: (item: PRItem) => item.currentStep || "—" },
  {
    key: "createdAt",
    label: "تاریخ",
    render: (item: PRItem) => item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—",
  },
]

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

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState
              icon={ShoppingCart}
              title="درخواستی یافت نشد"
              description="هیچ درخواست خریدی برای بررسی وجود ندارد"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-fog">
                {items.length} درخواست
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={items}
                keyExtractor={(item: PRItem) => item._id}
              />
            </CardContent>
          </Card>

          <Pagination
            prevPageUrl={prevPageUrl}
            nextPageUrl={nextPageUrl}
            currentPage={page}
          />
        </>
      )}
    </div>
  )
}
