import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/stuff/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { StuffEditClient } from "./stuff-edit-client"
import type { StuffDetail } from "../stuff-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

const EDIT_PROJECTION = {
  _id: 1,
  quantity: 1,
  price: 1,
  hasAbsolutePrice: 1,
  pricePercentage: 1,
  expiration: 1,
  barcode: 1,
  createdAt: 1,
  ware: { _id: 1, name: 1, brand: 1 },
  store: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareModel: { _id: 1, name: 1 },
} as const

export default async function StuffEditPage({ params }: Props) {
  const { id } = await params

  const itemResult = await get({ _id: id }, EDIT_PROJECTION)
  const item = itemResult.success ? itemResult.body?.[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="موجودی یافت نشد"
          message="موجودی فروشگاهی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/stuff">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به موجودی فروشگاه‌ها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <StuffEditClient item={item as StuffDetail} />
}