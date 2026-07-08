"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Store, Search, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { assignStore } from "@/app/actions/purchasingRequest/assignStore";
import { checkStoreAvailability } from "@/app/actions/purchasingRequest/checkStoreAvailability";
import { gets as getStores } from "@/app/actions/store/gets";

interface StoreItem {
  _id: string;
  name?: string;
  status?: string;
  score?: number;
}

interface CheckResult {
  _id?: string;
  inventoryNo?: string;
  price?: number;
}

interface AssignStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchasingRequestId: string;
  wareModelId?: string;
}

export function AssignStoreDialog({ open, onOpenChange, purchasingRequestId, wareModelId }: AssignStoreDialogProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [availability, setAvailability] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    setSelectedStore(null);
    setAvailability(null);
    try {
      const result = await getStores(
        { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 30, search: search || undefined },
        { _id: 1, name: 1, status: 1, score: 1 }
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

  const handleCheckAvailability = async (storeId: string) => {
    setSelectedStore(storeId);
    if (!wareModelId) return;
    setChecking(true);
    try {
      const result = await checkStoreAvailability(
        { activeRoleId: getActiveRoleIdFromStore(), purchasingRequestId, storeId },
        { _id: 1, price: 1 }
      );
      if (result.success && result.body?.[0]) {
        setAvailability(result.body[0]);
      } else {
        setAvailability(null);
      }
    } catch {
      setAvailability(null);
    } finally {
      setChecking(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStore) return;
    setAssigning(true);
    try {
      const result = await assignStore(
        { activeRoleId: getActiveRoleIdFromStore(), _id: purchasingRequestId, assignedFromId: selectedStore },
        { _id: 1, status: 1 }
      );
      if (result.success) {
        toast.success("فروشگاه با موفقیت تخصیص یافت.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در تخصیص فروشگاه");
      }
    } catch {
      toast.error("خطا در تخصیص فروشگاه");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-glacier">تخصیص فروشگاه</DialogTitle>
          <DialogDescription className="text-fog/70">انتخاب فروشگاه برای تأمین کالای درخواست</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
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

          {/* Store List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-center text-fog/50 py-4">در حال جستجو...</p>
            ) : !searched ? (
              <p className="text-center text-fog/40 py-4">نام فروشگاه را جستجو کنید</p>
            ) : stores.length === 0 ? (
              <p className="text-center text-fog/50 py-4">فروشگاهی یافت نشد</p>
            ) : (
              stores.map((store) => (
                <button
                  key={store._id}
                  type="button"
                  onClick={() => handleCheckAvailability(store._id)}
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={cn(
                        "text-[10px] px-1.5 py-0",
                        store.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      )}>
                        {store.status === "Active" ? "فعال" : store.status === "Inactive" ? "غیرفعال" : "—"}
                      </Badge>
                      {store.score != null && (
                        <span className="text-[10px] text-fog/40">{store.score} امتیاز</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Availability Info */}
          {selectedStore && (
            <div className="p-3 rounded-lg bg-white/[0.02] border border-steel-border/20">
              {checking ? (
                <div className="flex items-center gap-2 text-sm text-fog/50">
                  <Loader2 className="size-4 animate-spin" />
                  بررسی موجودی...
                </div>
              ) : availability ? (
                <div className="space-y-1 text-sm">
                  <p className="text-moonlight">موجودی و قیمت:</p>
                  {availability.price != null && (
                    <p className="text-fog font-mono" dir="ltr">
                      {availability.price.toLocaleString("fa-IR")} ریال
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-fog/50">اطلاعات موجودی برای این فروشگاه در دسترس نیست.</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={assigning}>
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleAssign}
              disabled={!selectedStore || assigning}
              className="gap-1.5"
            >
              {assigning ? <Loader2 className="size-4 animate-spin" /> : <Store className="size-4" />}
              {assigning ? "در حال تخصیص..." : "تخصیص فروشگاه"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
