import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/paymentOrder/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { PaymentOrderEditClient } from "./payment-order-edit-client"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  title: 1,
  amount: 1,
  description: 1,
  status: 1,
  paidAt: 1,
  purchasingRequest: { _id: 1, title: 1 },
  payTo: { _id: 1, name: 1 },
  financialUnit: { _id: 1, name: 1 },
} as const

export default async function EditPaymentOrderPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

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

  return <PaymentOrderEditClient item={item} />
}
