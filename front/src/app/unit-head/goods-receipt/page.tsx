import Link from "next/link"
import { ArrowRight, Package } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { cookies } from "next/headers"
import { getMe } from "@/app/actions/user/getMe"
import { GoodsReceiptClient } from "./goods-receipt-client"

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

  if (!warehouseUnitId) {
    return (
      <div className="space-y-6">
        <Link
          href="/unit-head"
          className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
        >
          <ArrowRight className="size-4" />
          بازگشت به داشبورد
        </Link>
        <Card variant="glass">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
              <Package className="size-6 text-fog/30" />
            </div>
            <p className="text-sm font-medium text-fog/50">دسترسی غیرمجاز</p>
            <p className="text-xs text-fog/30 mt-1">شما سرپرست انبار نیستید. فقط سرپرستان انبار می‌توانند کالا دریافت کنند.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const result = await getPRs(
    { page: 1, limit: 50, unitId: warehouseUnitId, stuffStatus: "delivered" },
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
        href="/unit-head"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>

      <PageHeader
        title="تحویل کالا"
        description={`مدیریت دریافت کالا در ${warehouseName || "انبار"}`}
      />

      <GoodsReceiptClient
        items={items}
        warehouseUnitId={warehouseUnitId}
        currentUserId={currentUserId || ""}
        warehouseName={warehouseName}
      />
    </div>
  )
}
