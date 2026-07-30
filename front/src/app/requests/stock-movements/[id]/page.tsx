import { get } from "@/app/actions/stockMovement/get"
import { notFound } from "next/navigation"
import { StockMovementDetailClient } from "./stock-movement-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EmployeeStockMovementDetailPage({ params }: Props) {
  const { id } = await params

  const result = await get(
    { _id: id },
    {
      _id: 1, quantity: 1, balanceBefore: 1, balanceAfter: 1,
      reason: 1, description: 1, createdAt: 1, updatedAt: 1,
      unit: { _id: 1, name: 1, type: 1 },
      createdBy: { _id: 1, first_name: 1, last_name: 1 },
      store: { _id: 1, name: 1 },
      ware: { _id: 1, name: 1, enName: 1, brand: 1 },
      wareModel: { _id: 1, name: 1, enName: 1 },
      wareGroup: { _id: 1, name: 1 },
      wareClass: { _id: 1, name: 1 },
      wareType: { _id: 1, name: 1 },
    }
  )

  const item = result.success && result.body?.[0] ? result.body[0] : null
  if (!item) notFound()

  return <StockMovementDetailClient item={item} />
}
