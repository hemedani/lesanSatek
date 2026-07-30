import Link from "next/link"
import { ArrowRight, Warehouse } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { cookies } from "next/headers"
import { gets as getInventories } from "@/app/actions/inventory/gets"
import { getWarehouseInventory } from "@/app/actions/inventory/getWarehouseInventory"
import { getMe } from "@/app/actions/user/getMe"
import { get as getUnit } from "@/app/actions/unit/get"
import { InventoryClient } from "./inventory-client"

export default async function UnitHeadInventoryPage() {
  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let userUnitId: string | undefined
  let isWarehouse = false

  if (activeRoleId) {
    const userRes = await getMe({ _id: 1, roles: 1 }).catch(() => ({ success: false, body: null }))
    const currentUser = userRes.success ? userRes.body : null
    const activeRole = currentUser?.roles?.find((r: { roleId?: string }) => r.roleId === activeRoleId)
    if (activeRole?.scopeType === "unit" && activeRole.scopeId) {
      userUnitId = activeRole.scopeId
    }
  }

  if (userUnitId) {
    const unitRes = await getUnit({ _id: userUnitId }, { _id: 1, type: 1 }).catch(() => ({ success: false, body: null }))
    if (unitRes.success && unitRes.body?.[0]) {
      isWarehouse = unitRes.body[0].type === "Warehouse"
    }
  }

  const projection = {
    _id: 1,
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 1,
    batchNo: 1,
    expirationDate: 1,
    location: 1,
    lastCountedAt: 1,
    createdAt: 1,
    unit: { _id: 1, name: 1, type: 1 },
    warehouseUnit: { _id: 1, name: 1, type: 1 },
    ware: { _id: 1, name: 1, enName: 1, brand: 1 },
    wareModel: { _id: 1, name: 1, enName: 1 },
    wareGroup: { _id: 1, name: 1 },
    wareClass: { _id: 1, name: 1 },
    wareType: { _id: 1, name: 1 },
  } as const

  let items: any[] = []

  if (isWarehouse) {
    const result = await getWarehouseInventory(
      { page: 1, limit: 100 },
      projection,
    )
    if (result.success && result.body) {
      const body = result.body as any
      const central = body.centralWarehouse?.items || []
      const units = body.unitWarehouses?.items || []
      items = [...central, ...units]
    }
  } else {
    const result = await getInventories(
      { page: 1, limit: 100 },
      projection,
    )
    if (result.success) {
      items = result.body || []
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <Link href="/unit-head" className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors">
          <ArrowRight className="size-4" />
          بازگشت به داشبورد
        </Link>
        <PageHeader title="موجودی انبار" description="مشاهده موجودی کالا در واحد شما" />
        <Card variant="glass">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
              <Warehouse className="size-6 text-fog/30" />
            </div>
            <p className="text-sm font-medium text-fog/50">موجودی‌ای یافت نشد</p>
            <p className="text-xs text-fog/30 mt-1">هنوز هیچ موجودی برای واحد شما ثبت نشده است.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/unit-head" className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors">
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>
      <PageHeader title="موجودی انبار" description="مشاهده موجودی کالا در واحد شما" />
      <InventoryClient items={items} isWarehouseGrouped={isWarehouse} userUnitId={userUnitId} />
    </div>
  )
}
