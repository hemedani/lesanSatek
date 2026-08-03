import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/inventory/get"
import { gets as getMovements } from "@/app/actions/stockMovement/gets"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { InventoryDetailClient } from "./inventory-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

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
  ware: { _id: 1, name: 1, enName: 1, brand: 1 },
  wareModel: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

const MOVEMENT_PROJECTION = {
  _id: 1,
  quantity: 1,
  balanceBefore: 1,
  balanceAfter: 1,
  reason: 1,
  referenceType: 1,
  description: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1 },
} as const

export default async function InventoryDetailPage({ params }: Props) {
  const { id } = await params

  const itemResult = await get({ _id: id }, INVENTORY_PROJECTION)
  const item = itemResult.success ? itemResult.body?.[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="موجودی یافت نشد"
          message="موجودی انباری با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/inventory">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به موجودی انبار
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const movementsResult = item.ware?._id
    ? await getMovements(
        {
          activeRoleId: "",
          page: 1,
          limit: 25,
          sortBy: "createdAt",
          sortOrder: "desc",
          wareId: item.ware._id,
          unitId: item.unit?._id || "",
        },
        MOVEMENT_PROJECTION
      )
    : null

  const movements = movementsResult && movementsResult.success && Array.isArray(movementsResult.body) ? movementsResult.body : []

  return <InventoryDetailClient item={item} movements={movements} />
}