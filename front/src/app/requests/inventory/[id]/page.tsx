import { get } from "@/app/actions/inventory/get"
import { notFound } from "next/navigation"
import { InventoryDetailClient } from "./inventory-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EmployeeInventoryDetailPage({ params }: Props) {
  const { id } = await params

  const result = await get(
    { _id: id },
    {
      _id: 1, quantity: 1, minQuantity: 1, maxQuantity: 1, batchNo: 1, location: 1, createdAt: 1, updatedAt: 1,
      unit: { _id: 1, name: 1 },
      warehouseUnit: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
      ware: { _id: 1, name: 1, wareModel: { _id: 1, name: 1 } },
    }
  )

  const item = result.success && result.body?.[0] ? result.body[0] : null
  if (!item) notFound()

  return <InventoryDetailClient item={item} />
}
