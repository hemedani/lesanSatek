"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { award } from "@/app/actions/tender/award";

interface OfferItem {
  _id: string;
  price?: number;
  deliveryTime?: string;
  paymentTerms?: string;
  status?: string;
  vendor?: { _id: string; name?: string };
}

interface TenderAwardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenderId: string;
  offers: OfferItem[];
}

export function TenderAwardDialog({ open, onOpenChange, tenderId, offers }: TenderAwardDialogProps) {
  const router = useRouter();
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [awarding, setAwarding] = useState(false);

  const handleAward = async () => {
    if (!selectedOfferId) return;
    setAwarding(true);
    try {
      const result = await award(
        { activeRoleId: getActiveRoleIdFromStore(), _id: tenderId, winningOfferId: selectedOfferId },
        { _id: 1, status: 1 }
      );
      if (result.success) {
        toast.success("مناقصه با موفقیت اعطا شد.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در اعطای مناقصه");
      }
    } catch {
      toast.error("خطا در اعطای مناقصه");
    } finally {
      setAwarding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-glacier">اعطای مناقصه</DialogTitle>
          <DialogDescription className="text-fog/70">انتخاب برنده مناقصه از میان پیشنهادات</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {offers.length === 0 ? (
            <p className="text-center text-fog/50 py-4">هیچ پیشنهادی ثبت نشده است.</p>
          ) : (
            offers.map((offer) => (
              <button
                key={offer._id}
                type="button"
                onClick={() => setSelectedOfferId(offer._id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-lg border text-start transition-all duration-200",
                  selectedOfferId === offer._id
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-steel-border/20 bg-transparent hover:border-steel-border/40"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-moonlight">
                    {offer.vendor?.name || "فروشنده"}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-fog/50">
                    {offer.price != null && (
                      <span dir="ltr">{offer.price.toLocaleString("fa-IR")} ریال</span>
                    )}
                    {offer.deliveryTime && <span>تحویل: {offer.deliveryTime}</span>}
                  </div>
                  {offer.paymentTerms && (
                    <p className="text-xs text-fog/40 mt-0.5">{offer.paymentTerms}</p>
                  )}
                </div>
                <Badge variant="outline" className={cn(
                  "text-[10px]",
                  offer.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  offer.status === "accepted" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                )}>
                  {offer.status === "pending" ? "در انتظار" : offer.status === "accepted" ? "پذیرفته شده" : "رد شده"}
                </Badge>
              </button>
            ))
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={awarding}>
              انصراف
            </Button>
            <Button type="button" onClick={handleAward} disabled={!selectedOfferId || awarding} className="gap-1.5">
              {awarding ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
              {awarding ? "در حال اعطا..." : "اعطای مناقصه"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
