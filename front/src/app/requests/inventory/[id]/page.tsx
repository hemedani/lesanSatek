import { notFound } from "next/navigation"
import { get as getInventory } from "@/app/actions/inventory/get"
import { gets as getStockMovements } from "@/app/actions/stockMovement/gets"
import { InventoryDetailClient } from "./inventory-detail-client"
import type { InventoryItem, StockMovementInline } from "./inventory-detail-client"

const INVENTORY_PROJECTION = {
  _id: 1,
  quantity: 1,
  minQuantity: 1,
  maxQuantity: 1,
  batchNo: 1,
  expirationDate: 1,
  location: 1,
  lastCountedAt: 1,
  createdAt: 1,
  updatedAt: 1,
  unit: { _id: 1, name: 1, type: 1 },
  warehouseUnit: { _id: 1, name: 1, type: 1 },
  ware: { _id: 1, name: 1, enName: 1, brand: 1, irc: 1, gtin: 1 },
  wareModel: { _id: 1, name: 1, enName: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

const MOVEMENT_PROJECTION = {
  _id: 1,
  quantity: 1,
  reason: 1,
  description: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1 },
  createdBy: { _id: 1, first_name: 1, last_name: 1 },
} as const

export default async function EmployeeInventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const result = await getInventory({ _id: id }, INVENTORY_PROJECTION)
  const item: InventoryItem | null =
    result.success && result.body?.[0] ? (result.body[0] as InventoryItem) : null
  if (!item) notFound()

  let movements: StockMovementInline[] = []
  if (item.ware?._id && item.unit?._id) {
    const mvRes = await getStockMovements(
      {
        page: 1,
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
        wareId: item.ware._id,
        unitId: item.unit._id,
      },
      MOVEMENT_PROJECTION,
    )
    movements = (mvRes.success ? mvRes.body || [] : []) as StockMovementInline[]
  }

  return <InventoryDetailClient item={item} movements={movements} />
}
