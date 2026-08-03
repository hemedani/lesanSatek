import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/paymentOrder/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { PaymentOrderDetailClient } from "./payment-order-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function PaymentOrderDetailPage({ params }: Props) {
  const { id } = await params

  const result = await get(
    { _id: id },
    {
      _id: 1,
      title: 1,
      amount: 1,
      description: 1,
      status: 1,
      paidAt: 1,
      createdAt: 1,
      updatedAt: 1,
      purchasingRequest: { _id: 1, title: 1 },
      issuedBy: { _id: 1, first_name: 1, last_name: 1 },
      approvedBy: { _id: 1, first_name: 1, last_name: 1 },
      payTo: { _id: 1, name: 1 },
      financialUnit: { _id: 1, name: 1 },
    }
  )

  const item = result.success ? result.body?.[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="دستور پرداخت یافت نشد"
          message="دستور پرداختی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/payment-orders">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به دستورات پرداخت
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <PaymentOrderDetailClient item={item} />
}
