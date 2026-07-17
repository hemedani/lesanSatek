"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Send, Loader2, Store, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { submit } from "@/app/actions/purchasingRequest/submit";
import { gets as getStores } from "@/app/actions/store/gets";

interface StoreItem {
  _id: string;
  name?: string;
  status?: string;
}

interface SubmitPRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchasingRequestId: string;
  title?: string;
  quantity?: number;
  wareModelName?: string;
}

export function SubmitPRDialog({ open, onOpenChange, purchasingRequestId, title, quantity, wareModelName }: SubmitPRDialogProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    setSelectedStore(null);
    try {
      const result = await getStores(
        { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 30, search: search || undefined },
        { _id: 1, name: 1, status: 1 }
      );
      if (result.success) {
        setStores(result.body || []);
      }
    } catch {
      toast.error("خطا در دریافت لیست فروشگاه‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submit(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: purchasingRequestId,
          ...(selectedStore ? { storeId: selectedStore } : {}),
        },
        { _id: 1, title: 1, status: 1, process: { _id: 1, name: 1 } }
      );
      if (result.success) {
        toast.success("درخواست خرید با موفقیت ارسال شد.");
        onOpenChange(false);
        router.refresh();
      } else {
        const msg = result.body?.message || "خطا در ارسال درخواست";
        if (msg.includes("active role does not have an associated unit")) {
          toast.error("نقش فعال شما به هیچ واحدی متصل نیست.");
        } else if (msg.includes("Could not determine organization")) {
          toast.error("شما به هیچ سازمانی تعلق ندارید.");
        } else if (msg.includes("Only Draft purchasing requests can be submitted")) {
          toast.error("این درخواست قبلاً ارسال شده است.");
        } else if (msg.includes("can only submit purchase requests for your own unit")) {
          toast.error("شما فقط می‌توانید درخواست‌های واحد خود را ارسال کنید.");
        } else if (msg.includes("linked tender is")) {
          toast.error("این درخواست مناقصه فعال دارد. ابتدا مناقصه را تعیین تکلیف کنید.");
        } else if (msg.includes("Purchasing request not found")) {
          toast.error("درخواست خرید یافت نشد.");
        } else if (msg.includes("No active process found")) {
          toast.error("فرآیند خرید فعالی برای این واحد یافت نشد. با مدیر خود تماس بگیرید.");
        } else {
          toast.error(msg);
        }
      }
    } catch {
      toast.error("خطا در ارسال درخواست خرید");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-glacier">ارسال درخواست خرید</DialogTitle>
          <DialogDescription className="text-fog/70">
            با ارسال این درخواست، فرآیند خرید آغاز می‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* PR Summary */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-steel-border/20 space-y-2">
            <p className="text-sm font-medium text-moonlight truncate">{title || "—"}</p>
            <div className="flex items-center gap-4 text-xs text-fog/50">
              {quantity != null && <span>تعداد: {quantity.toLocaleString("fa-IR")}</span>}
              {wareModelName && <span>کالا: {wareModelName}</span>}
            </div>
          </div>

          {/* Optional Store Assignment */}
          <div>
            <p className="text-sm font-medium text-moonlight mb-2">اختصاص فروشگاه (اختیاری)</p>
            <p className="text-xs text-fog/50 mb-3">در صورت تمایل، فروشگاه تأمین‌کننده را انتخاب کنید.</p>

            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-fog/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  placeholder="جستجوی فروشگاه..."
                  className="w-full h-9 pe-9 ps-9 rounded-sm border border-steel-border/60 bg-transparent text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <Button size="sm" onClick={handleSearch} disabled={loading} className="shrink-0">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "جستجو"}
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {loading ? (
                <p className="text-center text-fog/50 py-3">در حال جستجو...</p>
              ) : !searched ? (
                <p className="text-center text-fog/40 py-3">نام فروشگاه را جستجو کنید</p>
              ) : stores.length === 0 ? (
                <p className="text-center text-fog/50 py-3">فروشگاهی یافت نشد</p>
              ) : (
                stores.map((store) => (
                  <button
                    key={store._id}
                    type="button"
                    onClick={() => setSelectedStore(store._id === selectedStore ? null : store._id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-start transition-all duration-200",
                      selectedStore === store._id
                        ? "border-electric-iris/30 bg-electric-iris/5"
                        : "border-steel-border/20 bg-transparent hover:border-steel-border/40"
                    )}
                  >
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0",
                      selectedStore === store._id ? "bg-electric-iris/10" : "bg-white/[0.03]"
                    )}>
                      {selectedStore === store._id ? (
                        <Check className="size-4 text-electric-iris" />
                      ) : (
                        <Store className="size-4 text-fog/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-moonlight truncate">{store.name || "—"}</p>
                      <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 py-0 mt-0.5",
                        store.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      )}>
                        {store.status === "Active" ? "فعال" : "—"}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1.5"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {submitting ? "در حال ارسال..." : "ارسال درخواست"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
