"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Gavel, Clock, Building2, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TenderAwardDialog } from "@/components/purchasing/tender-award-dialog"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import { removeTenderSelection } from "@/app/actions/purchasingRequest/removeTenderSelection"

interface OfferItem {
  _id: string
  price?: number
  deliveryTime?: string
  paymentTerms?: string
  status?: string
  store?: { _id: string; name?: string }
}

interface ActiveTenderCardProps {
  tender: {
    _id: string
    title?: string
    status?: string
    deadline?: string
    offers?: OfferItem[]
  }
  purchasingRequestId: string
  selectedTenderOfferId?: string
}

export function ActiveTenderCard({ tender, purchasingRequestId, selectedTenderOfferId }: ActiveTenderCardProps) {
  const router = useRouter()
  const [awardOpen, setAwardOpen] = useState(false)
  const [removing, setRemoving] = useState(false)
  const offers = tender.offers || []
  const hasSelectedOffer = !!selectedTenderOfferId

  const handleRemoveSelection = async () => {
    setRemoving(true)
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
      setRemoving(false)
    }
  }

  return (
    <>
      <Card variant="glass" className="border-violet-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-inset ring-violet-500/15">
              <Gavel className="size-4 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-medium text-moonlight truncate">
                {tender.title || "مناقصه فعال"}
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn(
                  "text-[10px]",
                  hasSelectedOffer
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                )}>
                  {hasSelectedOffer ? "یک پیشنهاد انتخاب شده" : "فعال"}
                </Badge>
                {tender.deadline && (
                  <span className="text-[10px] text-fog/50 flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(tender.deadline).toLocaleDateString("fa-IR")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <p className="text-xs text-fog/50 text-center py-3">هیچ پیشنهادی ثبت نشده است</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-fog/60 mb-2">پیشنهادات دریافتی:</p>
              {offers.map((offer, idx) => (
                <div
                  key={offer._id}
                  className={cn(
                    "flex items-center justify-between gap-2 p-2.5 rounded-lg border",
                    offer._id === selectedTenderOfferId
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-steel-border/20 bg-white/[0.02]"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-fog/40 shrink-0" />
                      <span className="text-xs font-medium text-moonlight truncate">
                        {offer.store?.name || `پیشنهاد ${idx + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-fog/50">
                      {offer.price != null && (
                        <span dir="ltr">{offer.price.toLocaleString("fa-IR")} ریال</span>
                      )}
                      {offer.deliveryTime && (
                        <span>تحویل: {offer.deliveryTime}</span>
                      )}
                    </div>
                    {offer.paymentTerms && (
                      <p className="text-[10px] text-fog/40 mt-0.5">{offer.paymentTerms}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[10px] shrink-0",
                    offer._id === selectedTenderOfferId
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : ""
                  )}>
                    {offer._id === selectedTenderOfferId ? "انتخاب شده" :
                     offer.status === "pending" ? "در انتظار" :
                     offer.status === "accepted" ? "پذیرفته" :
                     offer.status === "rejected" ? "رد شده" : offer.status}
                  </Badge>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                {!hasSelectedOffer ? (
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    variant="outline"
                    onClick={() => setAwardOpen(true)}
                  >
                    <Check className="size-3.5" />
                    انتخاب برنده مناقصه
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    variant="ghost"
                    onClick={handleRemoveSelection}
                    disabled={removing}
                  >
                    {removing ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                    {removing ? "در حال لغو..." : "لغو انتخاب"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TenderAwardDialog
        open={awardOpen}
        onOpenChange={setAwardOpen}
        purchasingRequestId={purchasingRequestId}
        tenderId={tender._id}
        offers={offers}
      />
    </>
  )
}
