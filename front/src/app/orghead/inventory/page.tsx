import { PageHeader } from "@/components/ui/page-header"
import { gets as getInventories } from "@/app/actions/inventory/gets"
import { InventoryClient } from "./inventory-client"

export default async function OrgHeadInventoryPage() {
  const result = await getInventories(
    { page: 1, limit: 200 },
    {
      _id: 1,
      quantity: 1,
      minQuantity: 1,
      maxQuantity: 1,
      batchNo: 1,
      location: 1,
      expirationDate: 1,
      lastCountedAt: 1,
      createdAt: 1,
      unit: { _id: 1, name: 1, type: 1 },
      warehouseUnit: { _id: 1, name: 1, type: 1 },
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
      <PageHeader title="موجودی انبار" description="مشاهده و مدیریت موجودی کالا در سطح سازمان" />
      <InventoryClient items={items} />
    </div>
  )
}
