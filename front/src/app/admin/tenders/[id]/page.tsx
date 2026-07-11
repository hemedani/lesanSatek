"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Gavel, ArrowRight, Clock, Store, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { get } from "@/app/actions/tender/get";
import { gets as getOffers } from "@/app/actions/tenderOffer/gets";
import { TenderAwardDialog } from "@/components/purchasing/tender-award-dialog";

interface TenderOffer {
  _id: string;
  price?: number;
  deliveryTime?: string;
  paymentTerms?: string;
  status?: string;
  description?: string;
  submittedAt?: string;
  vendor?: { _id: string; name?: string };
}

interface TenderData {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  deadline?: string;
  createdAt?: string;
  purchasingRequest?: { _id: string; title?: string };
}

export default function TenderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [tender, setTender] = useState<TenderData | null>(null);
  const [offers, setOffers] = useState<TenderOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAward, setShowAward] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await get(
        { _id: id },
        {
          _id: 1, title: 1, description: 1, status: 1, deadline: 1, createdAt: 1,
          purchasingRequest: { _id: 1, title: 1 },
        }
      );
      if (result.success && result.body?.[0]) {
        setTender(result.body[0]);
      } else {
        toast.error("مناقصه یافت نشد");
        router.push("/admin/tenders");
      }
      setLoading(false);
    })();
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const result = await getOffers(
        { filter: { tenderId: id }, page: 1, limit: 100 },
        { _id: 1, price: 1, deliveryTime: 1, paymentTerms: 1, status: 1, description: 1, submittedAt: 1,
          vendor: { _id: 1, name: 1 } }
      );
      if (result.success && Array.isArray(result.body)) {
        setOffers(result.body);
      }
    })();
  }, [id]);

  if (loading) {
    return <div className="space-y-6">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;
  }

  if (!tender) return null;

  const isOpen = tender.status === "open";

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <div className="flex items-center justify-between pb-4 border-b border-steel-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/admin/tenders")} className="rounded-lg">
              <ArrowRight className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-moonlight tracking-tight truncate">{tender.title || "بدون عنوان"}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn(
                  "text-[11px] px-2 py-0.5 font-medium",
                  isOpen ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                )}>
                  {isOpen ? "باز" : tender.status === "awarded" ? "اعطا شده" : "بسته شده"}
                </Badge>
                {tender.purchasingRequest?.title && (
                  <span className="text-xs text-fog/50">{tender.purchasingRequest.title}</span>
                )}
              </div>
            </div>
          </div>
          {isOpen && offers.length > 0 && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowAward(true)}>
              <Award className="size-4" /> اعطای مناقصه
            </Button>
          )}
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
                  <CardDescription>{offers.length} پیشنهاد</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {offers.length === 0 ? (
                <p className="text-sm text-fog/50 text-center py-4">هنوز پیشنهادی ثبت نشده است.</p>
              ) : (
                offers.map((offer) => (
                  <div key={offer._id} className="p-4 rounded-lg border border-steel-border/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-moonlight">{offer.vendor?.name || "فروشنده"}</p>
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        offer.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        offer.status === "accepted" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {offer.status === "pending" ? "در انتظار" : offer.status === "accepted" ? "پذیرفته شده" : "رد شده"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-fog/50">
                      {offer.price != null && <span dir="ltr">{offer.price.toLocaleString("fa-IR")} ریال</span>}
                      {offer.deliveryTime && <span>تحویل: {offer.deliveryTime}</span>}
                    </div>
                    {offer.paymentTerms && <p className="text-xs text-fog/40">{offer.paymentTerms}</p>}
                    {offer.description && <p className="text-xs text-fog/40">{offer.description}</p>}
                    {offer.submittedAt && (
                      <p className="text-[10px] text-fog/30">{new Date(offer.submittedAt).toLocaleDateString("fa-IR")}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>اطلاعات مناقصه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-fog/50">
                <Clock className="size-4" />
                <span>مهلت: </span>
                <span className="text-moonlight font-mono" dir="ltr">
                  {tender.deadline ? new Date(tender.deadline).toLocaleDateString("fa-IR") : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-fog/50">
                <Gavel className="size-4" />
                <span>وضعیت: </span>
                <Badge variant="outline" className={cn("text-[10px]", isOpen ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20")}>
                  {isOpen ? "باز" : tender.status === "awarded" ? "اعطا شده" : "بسته شده"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-fog/50">
                <Store className="size-4" />
                <span>پیشنهادات: </span>
                <span className="text-moonlight">{offers.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TenderAwardDialog
        open={showAward}
        onOpenChange={setShowAward}
        tenderId={tender._id}
        offers={offers}
      />
    </div>
  );
}
