import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/goodsReceipt/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { GoodsReceiptDetailClient } from "./goods-receipt-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function GoodsReceiptDetailPage({ params }: Props) {
  const { id } = await params

  const receiptResult = await get(
    { _id: id },
    {
      _id: 1,
      receiptNumber: 1,
      description: 1,
      receivedAt: 1,
      status: 1,
      notes: 1,
      items: 1,
      createdAt: 1,
      updatedAt: 1,
      purchasingRequest: { _id: 1, title: 1 },
      receivedBy: { _id: 1, first_name: 1, last_name: 1 },
      receivingUnit: { _id: 1, name: 1 },
    }
  )

  const receipt = receiptResult.success ? receiptResult.body?.[0] : null

  if (!receipt) {
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

  return <GoodsReceiptDetailClient receipt={receipt} />
}
