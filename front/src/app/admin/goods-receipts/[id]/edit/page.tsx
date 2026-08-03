import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/goodsReceipt/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { GoodsReceiptEditClient } from "./goods-receipt-edit-client"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  receiptNumber: 1,
  description: 1,
  receivedAt: 1,
  status: 1,
  notes: 1,
  items: 1,
  purchasingRequest: { _id: 1, title: 1 },
} as const

export default async function EditGoodsReceiptPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="رسید کالا یافت نشد"
          message="رسید کالایی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/goods-receipts">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به رسیدها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <GoodsReceiptEditClient receipt={item} />
}