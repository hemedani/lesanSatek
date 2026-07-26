"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { markPaid } from "@/app/actions/paymentOrder/markPaid"
import { toast } from "sonner"

interface MarkPaidButtonProps {
  paymentOrderId: string
  amount: number
}

export function MarkPaidButton({ paymentOrderId, amount }: MarkPaidButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleMarkPaid = async () => {
    setLoading(true)
    setShowConfirm(false)
    try {
      const result = await markPaid({ _id: paymentOrderId })
      if (result.success) {
        toast.success("پرداخت با موفقیت ثبت شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در ثبت پرداخت")
      }
    } catch {
      toast.error("خطا در ثبت پرداخت")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-fog">عملیات پرداخت</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-fog mb-2">
            با تأیید پرداخت، مبلغ {amount.toLocaleString("fa-IR")} ریال از بودجه کسر خواهد شد.
          </p>
          <Button
            className="w-full gap-2"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
            {loading ? "در حال ثبت..." : "تأیید و ثبت پرداخت"}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={(open) => { if (!open) setShowConfirm(false) }}
        title="تأیید پرداخت"
        description={`آیا از ثبت پرداخت ${amount.toLocaleString("fa-IR")} ریال اطمینان دارید؟ این مبلغ از بودجه کسر خواهد شد.`}
        confirmLabel="تأیید پرداخت"
        onConfirm={handleMarkPaid}
        loading={loading}
      />
    </>
  )
}
