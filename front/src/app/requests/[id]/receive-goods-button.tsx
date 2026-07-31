"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardCheck, Loader2, Warehouse, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { receiveGoods } from "@/app/actions/purchasingRequest/receiveGoods"

interface ReceiveGoodsButtonProps {
  purchasingRequestId: string
  wareModelId: string
  quantity: number
  receivingUnitId: string
  receivedById: string
  wareModelName?: string
  className?: string
}

function ReceiveGoodsButton({ purchasingRequestId, wareModelId, quantity, receivingUnitId, receivedById, wareModelName, className }: ReceiveGoodsButtonProps) {
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
      <Button onClick={() => setShowConfirm(true)} disabled={loading} className={className || "gap-2 w-full"}>
        {loading ? <Loader2 className="size-5 animate-spin" /> : <ClipboardCheck className="size-5" />}
        {loading ? "در حال دریافت..." : "دریافت کالا"}
      </Button>

      <Dialog open={showConfirm} onOpenChange={(open) => { if (!open) setShowConfirm(false) }}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cipher-mint/10 ring-1 ring-inset ring-cipher-mint/20">
                <ClipboardCheck className="size-5 text-cipher-mint" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-moonlight">تأیید دریافت کالا</DialogTitle>
                <DialogDescription className="mt-1.5">
                  آیا از دریافت این کالا اطمینان دارید؟ پس از تأیید، موجودی انبار واحد شما به‌روزرسانی می‌شود و دستور پرداخت ایجاد می‌گردد.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border border-steel-border/20 bg-white/[0.02] p-4">
              <p className="text-caption font-medium text-fog">کالا</p>
              <p className="mt-1 text-body font-medium text-moonlight">{wareModelName || "—"}</p>
              <p className="mt-2 text-caption font-medium text-fog">تعداد</p>
              <p className="mt-1 text-body font-semibold text-glacier">{quantity.toLocaleString("fa-IR")} عدد</p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex items-start gap-2.5 rounded-xl border border-steel-border/20 bg-white/[0.02] p-3">
                <Warehouse className="size-5 shrink-0 text-frost-link/80" />
                <p className="text-body-sm leading-6 text-moonlight/80">
                  موجودی انبار واحد شما به‌روزرسانی می‌شود.
                </p>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-steel-border/20 bg-white/[0.02] p-3">
                <CreditCard className="size-5 shrink-0 text-frost-link/80" />
                <p className="text-body-sm leading-6 text-moonlight/80">
                  دستور پرداخت برای این درخواست ایجاد می‌گردد.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>
              انصراف
            </Button>
            <Button onClick={handleReceive} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="size-5 animate-spin" /> : <ClipboardCheck className="size-5" />}
              {loading ? "در حال دریافت..." : "تأیید دریافت"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { ReceiveGoodsButton }
