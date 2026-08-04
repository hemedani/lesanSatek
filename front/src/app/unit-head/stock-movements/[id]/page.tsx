import { notFound } from "next/navigation"
import { get as getStockMovement } from "@/app/actions/stockMovement/get"
import { gets as getInventory } from "@/app/actions/inventory/gets"
import { StockMovementDetailClient } from "./stock-movement-detail-client"
import type { StockMovement } from "./stock-movement-detail-client"

const STOCK_MOVEMENT_PROJECTION = {
  _id: 1,
  quantity: 1,
  balanceBefore: 1,
  balanceAfter: 1,
  reason: 1,
  description: 1,
  referenceType: 1,
  referenceId: 1,
  createdAt: 1,
  updatedAt: 1,
  unit: { _id: 1, name: 1, type: 1 },
  createdBy: { _id: 1, first_name: 1, last_name: 1 },
  store: { _id: 1, name: 1 },
  ware: { _id: 1, name: 1, enName: 1, brand: 1 },
  wareModel: { _id: 1, name: 1, enName: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

export default async function UnitHeadStockMovementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const result = await getStockMovement({ _id: id }, STOCK_MOVEMENT_PROJECTION)
  const item: StockMovement | null =
    result.success && result.body?.[0] ? (result.body[0] as StockMovement) : null
  if (!item) notFound()

  let relatedInventoryId: string | null = null
  if (item.ware?._id && item.unit?._id) {
    const invRes = await getInventory(
      { page: 1, limit: 1, wareId: item.ware._id, unitId: item.unit._id },
      { _id: 1 },
    )
    if (invRes.success && invRes.body?.[0]?._id) {
      relatedInventoryId = invRes.body[0]._id
    }
  }

  return <StockMovementDetailClient item={item} relatedInventoryId={relatedInventoryId} />
}