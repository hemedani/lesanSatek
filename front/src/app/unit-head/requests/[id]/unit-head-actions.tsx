"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Package, Gavel, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddStuffDialog } from "@/components/purchasing/add-stuff-dialog"
import { TenderCreateDialog } from "@/components/purchasing/tender-create-dialog"
import { SubmitPRButton } from "@/app/requests/[id]/submit-pr-button"
import { removeTenderSelection } from "@/app/actions/purchasingRequest/removeTenderSelection"

interface UnitHeadActionsProps {
  purchasingRequestId: string
  wareModelId?: string
  quantity?: number
  tenderCount: number
  hasCompletedTender: boolean
  selectionType?: string
  isDraft?: boolean
}

export function UnitHeadActions({
  purchasingRequestId,
  wareModelId,
  quantity,
  tenderCount,
  hasCompletedTender,
  selectionType,
  isDraft,
}: UnitHeadActionsProps) {
  const router = useRouter()
  const [addStuffOpen, setAddStuffOpen] = useState(false)
  const [createTenderOpen, setCreateTenderOpen] = useState(false)
  const [removingSelection, setRemovingSelection] = useState(false)

  const handleRemoveTenderSelection = async () => {
    setRemovingSelection(true)
    try {
      const result = await removeTenderSelection(
        { _id: purchasingRequestId },
        { _id: 1, selectionType: 1, selectedTenderOfferId: 1 }
      )
      if (result.success) {
        toast.success("انتخاب مناقصه با موفقیت لغو شد.")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در لغو انتخاب مناقصه")
      }
    } catch {
      toast.error("خطا در لغو انتخاب مناقصه")
    } finally {
      setRemovingSelection(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button className="w-full gap-2" onClick={() => setAddStuffOpen(true)}>
        <Package className="size-4" />
        تخصیص کالا
      </Button>

      {!hasCompletedTender && (
        <Button className="w-full gap-2" variant="secondary" onClick={() => setCreateTenderOpen(true)}>
          <Gavel className="size-4" />
          {tenderCount === 0 ? "ایجاد مناقصه" : "مناقصه جدید"}
        </Button>
      )}

      {selectionType === "tender" && (
        <Button className="w-full gap-2" variant="ghost" onClick={handleRemoveTenderSelection} disabled={removingSelection}>
          <X className="size-4" />
          {removingSelection ? "در حال لغو..." : "لغو انتخاب مناقصه"}
        </Button>
      )}

      {isDraft && selectionType && selectionType !== "none" && (
        <SubmitPRButton
          purchasingRequestId={purchasingRequestId}
          title={undefined}
          quantity={quantity}
          wareModelName={undefined}
        />
      )}

      {isDraft && (!selectionType || selectionType === "none") && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-body-sm leading-6 text-amber-400/90">
          برای ارسال این پیش‌نویس، ابتدا کالا تخصیص دهید یا از طریق مناقصه پیشنهاد انتخاب کنید.
        </p>
      )}

      <AddStuffDialog
        open={addStuffOpen}
        onOpenChange={setAddStuffOpen}
        purchasingRequestId={purchasingRequestId}
        wareModelId={wareModelId}
        quantity={quantity}
      />

      <TenderCreateDialog
        open={createTenderOpen}
        onOpenChange={setCreateTenderOpen}
        purchasingRequestId={purchasingRequestId}
      />
    </div>
  )
}
