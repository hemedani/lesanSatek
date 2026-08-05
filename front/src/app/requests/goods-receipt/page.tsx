import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { cookies } from "next/headers"
import { getMe } from "@/app/actions/user/getMe"
import { GoodsReceiptClient } from "@/app/unit-head/goods-receipt/goods-receipt-client"

interface PRItem {
  _id: string
  title?: string
  quantity?: number
  estimatedAmount?: number
  status?: string
  stuffStatus?: string
  requestingUnit?: { _id?: string; name?: string }
  wareModel?: { _id?: string; name?: string }
  organization?: { _id?: string; name?: string }
}

export default async function GoodsReceiptPage() {
  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let currentUserId: string | undefined

  if (activeRoleId) {
    const userRes = await getMe({
      _id: 1,
      roles: 1,
    }).catch(() => ({ success: false, body: null }))
    const user = userRes.success ? userRes.body : null
    currentUserId = user?._id
  }

  let warehouseUnitId: string | undefined
  let warehouseName: string | undefined

  if (currentUserId) {
    const warehouseUnitsRes = await getUnits(
      { page: 1, limit: 50, type: "Warehouse" },
      { _id: 1, name: 1, head: { _id: 1 } }
    ).catch(() => ({ success: false, body: null }))
    if (warehouseUnitsRes.success && warehouseUnitsRes.body) {
      const userWarehouse = warehouseUnitsRes.body.find(
        (u: { head?: { _id?: string } }) => u.head?._id === currentUserId
      )
      if (userWarehouse) {
        warehouseUnitId = userWarehouse._id
        warehouseName = userWarehouse.name
      }
    }
  }

  const isWarehouseHead = Boolean(warehouseUnitId)

  const result = await getPRs(
    { page: 1, limit: 50, stuffStatus: "delivered" },
    {
      _id: 1,
      title: 1,
      quantity: 1,
      estimatedAmount: 1,
      status: 1,
      stuffStatus: 1,
      requestingUnit: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
      organization: { _id: 1, name: 1 },
    },
  )

  const items: PRItem[] = result.success ? result.body || [] : []

  return (
    <div className="space-y-6">
      <Link
        href="/requests"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>

      <PageHeader
        title="دریافت کالا"
        description="مدیریت دریافت کالا"
      >
        <HelpLauncher topicId="requests-goods-receipt" tooltip="راهنمای دریافت کالا" />
      </PageHeader>

      <GoodsReceiptClient
        items={items}
        warehouseUnitId={warehouseUnitId}
        currentUserId={currentUserId || ""}
        warehouseName={warehouseName}
        detailHrefPrefix="/requests"
        isWarehouseHead={isWarehouseHead}
      />
    </div>
  )
}
