"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gavel, ArrowRight, Clock, Store, Award, Pencil, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TenderAwardDialog } from "@/components/purchasing/tender-award-dialog";

interface PurchasingRequestRef {
  _id: string;
  title?: string;
}

interface TenderOffer {
  _id: string;
  price?: number;
  deliveryTime?: string;
  paymentTerms?: string;
  status?: string;
  description?: string;
  submittedAt?: string;
  store?: { _id: string; name?: string };
}

export interface Tender {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  deadline?: string;
  createdAt?: string;
  purchasingRequest?: PurchasingRequestRef;
}

interface TenderDetailClientProps {
  tender: Tender;
  offers: TenderOffer[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  open: { label: "باز", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  closed: { label: "بسته شده", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  awarded: { label: "اعطا شده", className: "bg-electric-iris/10 text-electric-iris border-electric-iris/20" },
  cancelled: { label: "لغو شده", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

const offerStatusConfig: Record<string, { label: string; className: string }> = {
  submitted: { label: "در انتظار", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  accepted: { label: "پذیرفته شده", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "رد شده", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-steel-border/20 last:border-b-0">
      <div className="size-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0">
        <Icon className="size-4 text-fog/50" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-fog/50">{label}</p>
        <div className="text-sm text-moonlight mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export function TenderDetailClient({ tender, offers }: TenderDetailClientProps) {
  const router = useRouter();
  const [showAward, setShowAward] = useState(false);
  const isOpen = tender.status === "open";
  const status = statusConfig[tender.status || ""] || statusConfig.open;

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-steel-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/admin/tenders")}
              className="shrink-0 rounded-lg"
            >
              <ArrowRight className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-moonlight tracking-tight truncate">
                {tender.title || "بدون عنوان"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5 font-medium", status.className)}>
                  {status.label}
                </Badge>
                {tender.purchasingRequest?.title && (
                  <span className="text-xs text-fog/50 truncate">{tender.purchasingRequest.title}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/admin/tenders/${tender._id}/edit`}>
              <Button variant="ghost" className="gap-2 px-4">
                <Pencil className="size-5" />
                ویرایش
              </Button>
            </Link>
            {isOpen && offers.length > 0 && (
              <Button size="sm" className="gap-1.5" onClick={() => setShowAward(true)}>
                <Award className="size-4" /> اعطای مناقصه
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-[1]">
        <div className="lg:col-span-2 space-y-6">
          {tender.description && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle>توضیحات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-moonlight/80 leading-relaxed">{tender.description}</p>
              </CardContent>
            </Card>
          )}

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Store className="size-4 text-emerald-400" />
                </div>
                <div>
                  <CardTitle>پیشنهادات دریافت شده</CardTitle>
                  <CardDescription>{offers.length.toLocaleString("fa-IR")} پیشنهاد</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {offers.length === 0 ? (
                <p className="text-sm text-fog/50 text-center py-4">هنوز پیشنهادی ثبت نشده است.</p>
              ) : (
                offers.map((offer) => {
                  const oStatus = offerStatusConfig[offer.status || ""] || offerStatusConfig.submitted;
                  return (
                    <div key={offer._id} className="p-4 rounded-lg border border-steel-border/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-moonlight">{offer.store?.name || "فروشنده"}</p>
                        <Badge variant="outline" className={cn("text-[10px]", oStatus.className)}>
                          {oStatus.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-fog/50">
                        {offer.price != null && <span dir="ltr">{offer.price.toLocaleString("fa-IR")} ریال</span>}
                        {offer.deliveryTime && <span>تحویل: {offer.deliveryTime}</span>}
                      </div>
                      {offer.paymentTerms && <p className="text-xs text-fog/40">{offer.paymentTerms}</p>}
                      {offer.description && <p className="text-xs text-fog/40">{offer.description}</p>}
                      {offer.submittedAt && (
                        <p className="text-[10px] text-fog/30">{faDate(offer.submittedAt)}</p>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>اطلاعات مناقصه</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow icon={Clock} label="مهلت" value={<span className="font-mono">{faDate(tender.deadline)}</span>} />
                <InfoRow
                  icon={Gavel}
                  label="وضعیت"
                  value={<Badge variant="outline" className={cn("text-[10px]", status.className)}>{status.label}</Badge>}
                />
                <InfoRow icon={Store} label="پیشنهادات" value={offers.length.toLocaleString("fa-IR")} />
                <InfoRow icon={ShoppingCart} label="درخواست خرید"
                  value={tender.purchasingRequest?.title || "—"}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TenderAwardDialog
        open={showAward}
        onOpenChange={setShowAward}
        purchasingRequestId={tender.purchasingRequest?._id || ""}
        tenderId={tender._id}
        offers={offers}
      />
    </div>
  );
}