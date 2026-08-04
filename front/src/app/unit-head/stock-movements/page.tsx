import Link from "next/link"
import { ArrowRight, Warehouse, ScrollText } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { NavCard } from "@/components/dashboard/nav-card"
import { gets as getStockMovements } from "@/app/actions/stockMovement/gets"
import { count as countStockMovements } from "@/app/actions/stockMovement/count"
import { StockMovementsClient } from "./stock-movements-client"
import type { StockMovement, StockMovementCounts } from "./stock-movements-client"

const STOCK_MOVEMENT_PROJECTION = {
  _id: 1,
  quantity: 1,
  balanceBefore: 1,
  balanceAfter: 1,
  reason: 1,
  description: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1, type: 1 },
  createdBy: { _id: 1, first_name: 1, last_name: 1 },
  store: { _id: 1, name: 1 },
  ware: { _id: 1, name: 1, enName: 1, brand: 1 },
  wareModel: { _id: 1, name: 1, enName: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

export default async function UnitHeadStockMovementsPage() {
  const [listResult, countResult] = await Promise.all([
    getStockMovements(
      { page: 1, limit: 100 },
      STOCK_MOVEMENT_PROJECTION,
    ),
    countStockMovements({ activeRoleId: "" }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as StockMovement[]

  let incoming = 0
  let outgoing = 0
  for (const it of items) {
    if (it.quantity == null) continue
    if (it.quantity > 0) incoming++
    else if (it.quantity < 0) outgoing++
  }

  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length

  const counts: StockMovementCounts = { total, incoming, outgoing }

  return (
    <div className="space-y-6">
      <Link href="/unit-head" className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors">
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>
      <PageHeader
        title="گردش کالا"
        description="تاریخچه جابه‌جایی کالا در واحدها — ورود، خروج و دلیل هر حرکت"
      />

      <section className="space-y-4" aria-label="دسترسی سریع">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          <NavCard
            href="/unit-head/inventory"
            title="موجودی انبار"
            description="مشاهده موجودی کالاها"
            icon={Warehouse}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
            footerLabel="رفتن به موجودی انبار"
          />
          <NavCard
            href="/unit-head/consumption"
            title="مصرف کالا"
            description="ثبت و مشاهده مصرف کالاها"
            icon={ScrollText}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            footerLabel="رفتن به مصرف کالا"
          />
        </div>
      </section>

      <StockMovementsClient items={items} counts={counts} />
    </div>
  )
}