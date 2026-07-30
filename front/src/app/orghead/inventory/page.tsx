import Link from "next/link"
import { ArrowRight, Warehouse } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { gets as getInventories } from "@/app/actions/inventory/gets"
import { InventoryClient } from "./inventory-client"

export default async function OrgHeadInventoryPage() {
  const result = await getInventories(
    { page: 1, limit: 200 },
    { _id: 1, quantity: 1, minQuantity: 1, maxQuantity: 1, batchNo: 1, location: 1, createdAt: 1, unit: { _id: 1, name: 1 }, warehouseUnit: { _id: 1, name: 1 }, wareModel: { _id: 1, name: 1 }, ware: { _id: 1, name: 1 } },
  )

  const items = result.success ? result.body || [] : []

  return (
    <div className="space-y-6">
      <Link href="/orghead" className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors">
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>
      <PageHeader title="موجودی انبار" description="مشاهده موجودی کالا در سطح سازمان" />
      <InventoryClient items={items} />
    </div>
  )
}
