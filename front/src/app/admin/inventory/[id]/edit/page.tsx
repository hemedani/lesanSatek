import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/inventory/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { InventoryEditClient } from "./inventory-edit-client"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  quantity: 1,
  minQuantity: 1,
  maxQuantity: 1,
  batchNo: 1,
  expirationDate: 1,
  location: 1,
  unit: { _id: 1, name: 1 },
  warehouseUnit: { _id: 1, name: 1 },
  ware: { _id: 1, name: 1 },
} as const

export default async function EditInventoryPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

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

  return <InventoryEditClient item={item} />
}
