"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { receiveGoods } from "@/app/actions/purchasingRequest/receiveGoods"

interface ReceiveGoodsButtonProps {
  purchasingRequestId: string
  wareModelId: string
  quantity: number
  unitId: string
}

function ReceiveGoodsButton({ purchasingRequestId, wareModelId, quantity, unitId }: ReceiveGoodsButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleReceive = async () => {
    setLoading(true)
    try {
      const result = await receiveGoods({
        purchasingRequestId,
        wareModelId,
        quantity,
        unitId,
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
    <Button onClick={handleReceive} disabled={loading} className="gap-2 w-full">
      {loading ? <Loader2 className="size-4 animate-spin" /> : <ClipboardCheck className="size-4" />}
      {loading ? "در حال دریافت..." : "دریافت کالا"}
    </Button>
  )
}

export { ReceiveGoodsButton }
