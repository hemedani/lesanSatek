import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { gets as getStockMovements } from "@/app/actions/stockMovement/gets"
import { StockMovementsClient } from "./stock-movements-client"

export default async function OrgHeadStockMovementsPage() {
  const result = await getStockMovements(
    { page: 1, limit: 200 },
    {
      _id: 1,
      quantity: 1,
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
    },
  )

  const items = result.success ? result.body || [] : []

  return (
    <div className="space-y-6">
      <Link href="/orghead" className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors">
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>
      <PageHeader title="گردش کالا" description="مشاهده تاریخچه جابه‌جایی کالا در سطح سازمان" />
      <StockMovementsClient items={items} />
    </div>
  )
}
