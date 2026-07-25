"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Package, ShoppingCart, Building2, DollarSign, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import { receiveGoods } from "@/app/actions/purchasingRequest/receiveGoods"

interface PRItem {
  _id: string
  title?: string
  quantity?: number
  estimatedAmount?: number
  status?: string
  stuffStatus?: string
  requestingUnit?: { _id?: string; name?: string }
  wareModel?: { _id?: string; name?: string }
  organization?: { _id?: string; name?: string }
}

interface GoodsReceiptClientProps {
  items: PRItem[]
  warehouseUnitId: string
  currentUserId: string
  warehouseName?: string
}

function GoodsReceiptClient({ items, warehouseUnitId, currentUserId, warehouseName }: GoodsReceiptClientProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<PRItem | null>(null)

  const handleReceive = async (item: PRItem) => {
    if (!item.wareModel?._id) {
      toast.error("این درخواست مدل کالا ندارد")
      return
    }
    setLoadingId(item._id)
    setConfirmTarget(null)
    try {
      const result = await receiveGoods({
        purchasingRequestId: item._id,
        wareModelId: item.wareModel._id,
        quantity: item.quantity || 1,
        receivingUnitId: warehouseUnitId,
        receivedById: currentUserId,
      })
      if (result.success) {
        toast.success(`کالای "${item.title || "بدون عنوان"}" با موفقیت دریافت شد`)
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در دریافت کالا")
      }
    } catch {
      toast.error("خطا در دریافت کالا")
    } finally {
      setLoadingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-xl py-12">
        <EmptyState
          icon={Package}
          title="کالایی برای تحویل نیست"
          description="همه کالاهای آماده ارسال تحویل داده شده‌اند"
        />
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item._id}
            className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="size-5 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.title || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {item.organization?.name && (
                      <span className="text-xs text-fog/50 truncate flex items-center gap-1">
                        <Building2 className="size-3 shrink-0" />
                        {item.organization.name}
                      </span>
                    )}
                    {item.requestingUnit?.name && (
                      <span className="text-xs text-fog/50 truncate flex items-center gap-1">
                        <ShoppingCart className="size-3 shrink-0" />
                        {item.requestingUnit.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 shrink-0"
                disabled={loadingId === item._id}
                onClick={() => setConfirmTarget(item)}
              >
                {loadingId === item._id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Package className="size-4" />
                )}
                {loadingId === item._id ? "در حال دریافت..." : "دریافت کالا"}
              </Button>
            </div>
            <div className="flex items-center gap-x-5 gap-y-2 mt-3 text-xs text-fog/60 flex-wrap">
              {item.quantity != null && (
                <span className="flex items-center gap-1.5" dir="ltr">
                  <ShoppingCart className="size-3.5 text-fog/40" />
                  {item.quantity.toLocaleString("fa-IR")} عدد
                </span>
              )}
              {item.estimatedAmount != null && (
                <span className="flex items-center gap-1.5" dir="ltr">
                  <DollarSign className="size-3.5 text-fog/40" />
                  {item.estimatedAmount.toLocaleString("fa-IR")} ریال
                </span>
              )}
              {item.wareModel?.name && (
                <span className="flex items-center gap-1.5">
                  <Package className="size-3.5 text-fog/40" />
                  {item.wareModel.name}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}
        title="تأیید دریافت کالا"
        description={
          confirmTarget
            ? `آیا از دریافت "${confirmTarget.title || "بدون عنوان"}" در ${warehouseName || "انبار"} اطمینان دارید؟`
            : ""
        }
        confirmLabel="تأیید دریافت"
        onConfirm={() => confirmTarget && handleReceive(confirmTarget)}
        loading={loadingId === confirmTarget?._id}
      />
    </>
  )
}

export { GoodsReceiptClient }
