"use client"

import { useState } from "react"
import { Package, Check, ChevronDown, ChevronUp, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TenderAwardDialog } from "@/components/purchasing/tender-award-dialog"

interface OfferItem {
  _id: string
  price?: number
  deliveryTime?: string
  paymentTerms?: string
  status?: string
  store?: { _id: string; name?: string }
}

interface TenderItem {
  _id: string
  title?: string
  status?: string
  deadline?: string
  offers?: OfferItem[]
}

interface TendersListProps {
  tenders: TenderItem[]
  purchasingRequestId: string
}

export function TendersList({ tenders, purchasingRequestId }: TendersListProps) {
  const [expandedTenderId, setExpandedTenderId] = useState<string | null>(null)
  const [awardTenderId, setAwardTenderId] = useState<string | null>(null)

  if (tenders.length === 0) return null

  const selectedTender = tenders.find((t) => t._id === awardTenderId)

  const toggleExpand = (id: string) => {
    setExpandedTenderId(expandedTenderId === id ? null : id)
  }

  return (
    <>
      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-inset ring-violet-500/15">
              <Package className="size-4 text-violet-400" />
            </div>
            <CardTitle className="text-sm font-medium text-moonlight">مناقصات</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-steel-border/10">
            {tenders.map((t) => {
              const isExpanded = expandedTenderId === t._id
              const hasOffers = (t.offers?.length || 0) > 0
              return (
                <div key={t._id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-moonlight truncate">{t.title || "—"}</span>
                      {hasOffers && (
                        <span className="text-[10px] text-fog/40 shrink-0">({t.offers!.length} پیشنهاد)</span>
                      )}
                    </div>
                    <StatusBadge status={t.status || ""} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {t.deadline && (
                        <p className="text-xs text-fog/50">
                          مهلت: {new Date(t.deadline).toLocaleDateString("fa-IR")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasOffers && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs h-7"
                          onClick={() => toggleExpand(t._id)}
                        >
                          {isExpanded ? <ChevronUp className="size-3" /> : <Eye className="size-3" />}
                          {isExpanded ? "بستن پیشنهادات" : "مشاهده پیشنهادات"}
                        </Button>
                      )}
                      {t.status === "closed" && hasOffers && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs h-7"
                          onClick={() => setAwardTenderId(t._id)}
                        >
                          <Check className="size-3" />
                          انتخاب برنده
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && hasOffers && (
                    <div className="mt-3 space-y-2 ps-2 border-s-2 border-violet-500/20">
                      {t.offers!.map((offer, idx) => (
                        <div
                          key={offer._id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.02] border border-steel-border/10"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-moonlight">
                                {offer.store?.name || `پیشنهاد ${idx + 1}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-fog/50">
                              {offer.price != null && (
                                <span dir="ltr">{offer.price.toLocaleString("fa-IR")} ریال</span>
                              )}
                              {offer.deliveryTime && <span>تحویل: {offer.deliveryTime}</span>}
                            </div>
                            {offer.paymentTerms && (
                              <p className="text-[10px] text-fog/40 mt-0.5">{offer.paymentTerms}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[10px] shrink-0",
                            offer.status === "accepted" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            offer.status === "rejected" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                            "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          )}>
                            {offer.status === "accepted" ? "پذیرفته" :
                             offer.status === "rejected" ? "رد شده" :
                             offer.status === "submitted" ? "ارسال شده" : "در انتظار"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {isExpanded && !hasOffers && (
                    <p className="text-[11px] text-fog/40 mt-2 ps-2">هیچ پیشنهادی ثبت نشده است</p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedTender && (
        <TenderAwardDialog
          open={!!awardTenderId}
          onOpenChange={(open) => { if (!open) setAwardTenderId(null) }}
          purchasingRequestId={purchasingRequestId}
          tenderId={selectedTender._id}
          offers={selectedTender.offers || []}
        />
      )}
    </>
  )
}
