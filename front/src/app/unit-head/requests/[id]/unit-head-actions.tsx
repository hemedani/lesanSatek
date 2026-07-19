"use client"

import { useState } from "react"
import { Package, Gavel, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddStuffDialog } from "@/components/purchasing/add-stuff-dialog"
import { TenderCreateDialog } from "@/components/purchasing/tender-create-dialog"
import { TenderAwardDialog } from "@/components/purchasing/tender-award-dialog"
import { SubmitPRButton } from "@/app/requests/[id]/submit-pr-button"

interface OfferItem {
  _id: string
  price?: number
  deliveryTime?: string
  paymentTerms?: string
  status?: string
  vendor?: { _id: string; name?: string }
}

interface UnitHeadActionsProps {
  purchasingRequestId: string
  wareModelId?: string
  quantity?: number
  tenderCount: number
  activeTenderId?: string
  activeTenderOffers: OfferItem[]
  hasCompletedTender: boolean
}

export function UnitHeadActions({
  purchasingRequestId,
  wareModelId,
  quantity,
  tenderCount,
  activeTenderId,
  activeTenderOffers,
  hasCompletedTender,
}: UnitHeadActionsProps) {
  const [addStuffOpen, setAddStuffOpen] = useState(false)
  const [createTenderOpen, setCreateTenderOpen] = useState(false)
  const [awardTenderOpen, setAwardTenderOpen] = useState(false)

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

      {activeTenderOffers.length > 0 && (
        <Button className="w-full gap-2" variant="outline" onClick={() => setAwardTenderOpen(true)}>
          <Award className="size-4" />
          اعطای مناقصه
        </Button>
      )}

      <SubmitPRButton
        purchasingRequestId={purchasingRequestId}
        title={undefined}
        quantity={quantity}
        wareModelName={undefined}
      />

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

      {activeTenderId && (
        <TenderAwardDialog
          open={awardTenderOpen}
          onOpenChange={setAwardTenderOpen}
          tenderId={activeTenderId}
          offers={activeTenderOffers}
        />
      )}
    </div>
  )
}
