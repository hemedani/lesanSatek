import Link from "next/link"
import { ArrowRight, Warehouse, Activity } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { NavCard } from "@/components/dashboard/nav-card"
import { gets as getConsumptions } from "@/app/actions/consumption/gets"
import { count as countConsumptions } from "@/app/actions/consumption/count"
import { ConsumptionClient } from "./consumption-client"
import type { ConsumptionRecord, ConsumptionCounts } from "./consumption-client"

const CONSUMPTION_PROJECTION = {
  _id: 1, quantity: 1, notes: 1, reason: 1, consumedFor: 1, consumedAt: 1, createdAt: 1,
  unit: { _id: 1, name: 1, type: 1 },
  consumedBy: { _id: 1, first_name: 1, last_name: 1 },
  inventory: { _id: 1, quantity: 1 },
  ware: { _id: 1, name: 1, enName: 1, brand: 1 },
  wareModel: { _id: 1, name: 1, enName: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

export default async function UnitHeadConsumptionPage() {
  const [listResult, countResult] = await Promise.all([
    getConsumptions(
      { page: 1, limit: 100 },
      CONSUMPTION_PROJECTION,
    ),
    countConsumptions({}),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as ConsumptionRecord[]

  let totalQuantity = 0
  for (const it of items) {
    if (it.quantity != null) totalQuantity += it.quantity
  }

  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length

  const counts: ConsumptionCounts = {
    total,
    totalQuantity,
    averagePerRecord: total > 0 ? Math.round(totalQuantity / total) : 0,
  }

  return (
    <div className="space-y-6">
      <Link href="/unit-head" className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors">
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>
      <PageHeader
        title="مصرف کالا"
        description="ثبت و مشاهده مصرف کالاهای واحد — مقدار، مصرف‌شونده و تاریخ هر رکورد"
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
            href="/unit-head/stock-movements"
            title="گردش کالا"
            description="تاریخچه جابه‌جایی کالا"
            icon={Activity}
            iconColor="text-sky-400"
            iconBg="bg-sky-400/10"
            footerLabel="رفتن به گردش کالا"
          />
        </div>
      </section>

      <ConsumptionClient items={items} counts={counts} />
    </div>
  )
}
