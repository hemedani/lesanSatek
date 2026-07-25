"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"
import { receiveGoods } from "@/app/actions/purchasingRequest/receiveGoods"

interface ReceiveGoodsButtonProps {
  purchasingRequestId: string
  wareModelId: string
  quantity: number
  receivingUnitId: string
  receivedById: string
}

function ReceiveGoodsButton({ purchasingRequestId, wareModelId, quantity, receivingUnitId, receivedById }: ReceiveGoodsButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReceive = async () => {
    setLoading(true)
    setShowConfirm(false)
    try {
      const result = await receiveGoods({
        purchasingRequestId,
        wareModelId,
        quantity,
        receivingUnitId,
        receivedById,
      })
      if (result.success) {
        toast.success("کالا با موفقیت دریافت شد و به موجودی انبار اضافه گردید")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در دریافت کالا")
      }
    } catch {
      toast.error("خطا در دریافت کالا")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setShowConfirm(true)} disabled={loading} className="gap-2 w-full">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
        {loading ? "در حال دریافت..." : "دریافت کالا"}
      </Button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={(open) => { if (!open) setShowConfirm(false) }}
        title="تأیید دریافت کالا"
        description="آیا از دریافت این کالا اطمینان دارید؟ پس از تأیید، موجودی انبار واحد شما به‌روزرسانی خواهد شد و دستور پرداخت ایجاد می‌گردد."
        confirmLabel="تأیید دریافت"
        onConfirm={handleReceive}
        loading={loading}
      />
    </>
  )
}

export { ReceiveGoodsButton }
