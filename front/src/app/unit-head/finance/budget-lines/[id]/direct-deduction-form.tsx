"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { deductDirect } from "@/app/actions/budgetLine/deductDirect"
import { toast } from "sonner"

interface DirectDeductionFormProps {
  budgetLineId: string
  remainingBudget: number
}

export function DirectDeductionForm({ budgetLineId, remainingBudget }: DirectDeductionFormProps) {
  const router = useRouter()
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const amountNum = Number(amount.replace(/[^0-9]/g, "")) || 0
  const isValid = amountNum > 0 && amountNum <= remainingBudget

  const handleSubmit = async () => {
    if (!isValid) return
    setLoading(true)
    setShowConfirm(false)
    try {
      const result = await deductDirect({
        _id: budgetLineId,
        amount: amountNum,
        description: description || undefined,
      })
      if (result.success) {
        toast.success("کسری بودجه با موفقیت انجام شد")
        setAmount("")
        setDescription("")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در کسر بودجه")
      }
    } catch {
      toast.error("خطا در کسر بودجه")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 ring-1 ring-inset ring-rose-500/15">
              <Minus className="size-4 text-rose-400" />
            </div>
            <CardTitle className="text-sm font-medium text-fog">کسری مستقیم</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-fog/50">
            کسر مستقیم از بودجه بدون فرآیند تعهد (برای هزینه‌های غیرمرتبط با خرید)
          </p>
          <p className="text-xs text-fog">
            باقی‌مانده: {remainingBudget.toLocaleString("fa-IR")} ریال
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs text-fog">مبلغ (ریال)</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="مبلغ را وارد کنید"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-fog">توضیحات</Label>
            <Textarea
              placeholder="دلیل کسر بودجه"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            className="w-full gap-2"
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={!isValid || loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Minus className="size-4" />}
            {loading ? "در حال کسر..." : "کسر از بودجه"}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={(open) => { if (!open) setShowConfirm(false) }}
        title="تأیید کسر بودجه"
        description={`آیا از کسر ${amountNum.toLocaleString("fa-IR")} ریال از این ردیف بودجه اطمینان دارید؟${description ? `\n${description}` : ""}`}
        confirmLabel="تأیید کسر"
        onConfirm={handleSubmit}
        loading={loading}
      />
    </>
  )
}
