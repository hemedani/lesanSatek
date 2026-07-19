"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Package, Search, Loader2, Check, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { addStuff } from "@/app/actions/purchasingRequest/addStuff";
import { gets as getStuff } from "@/app/actions/stuff/gets";

interface StuffItem {
  _id: string;
  quantity?: number;
  price?: number;
  hasAbsolutePrice?: boolean;
  pricePercentage?: number;
  ware?: { _id?: string; name?: string; brand?: string };
  wareModel?: { _id?: string; name?: string };
  store?: { _id?: string; name?: string };
}

interface AddStuffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchasingRequestId: string;
  wareModelId?: string;
  quantity?: number;
}

type SortField = "price" | "quantity";
type SortDir = "asc" | "desc";

export function AddStuffDialog({ open, onOpenChange, purchasingRequestId, wareModelId, quantity }: AddStuffDialogProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<StuffItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortField, setSortField] = useState<SortField>("price");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const handleSearch = async (pageNum = 1) => {
    setLoading(true);
    setSearched(true);
    setSelectedId(null);
    try {
      const result = await getStuff(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          page: pageNum,
          limit: 20,
          ...(wareModelId ? { wareModelId } : {}),
          ...(search ? { search } : {}),
          ...(quantity ? { quantityMin: quantity } : {}),
          sortBy: sortField,
          sortOrder: sortDir,
        },
        {
          _id: 1,
          quantity: 1,
          price: 1,
          hasAbsolutePrice: 1,
          pricePercentage: 1,
          ware: { _id: 1, name: 1, brand: 1 },
          wareModel: { _id: 1, name: 1 },
          store: { _id: 1, name: 1 },
        }
      );
      if (result.success) {
        const data = result.body || [];
        setItems(data);
        setHasMore(data.length >= 20);
        setPage(pageNum);
      }
    } catch {
      toast.error("خطا در دریافت لیست کالاها");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedId) return;
    setAssigning(true);
    try {
      const result = await addStuff(
        { activeRoleId: getActiveRoleIdFromStore(), _id: purchasingRequestId, stuffId: selectedId },
        { _id: 1, stuffStatus: 1, estimatedAmount: 1 }
      );
      if (result.success) {
        toast.success("کالا با موفقیت تخصیص یافت.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در تخصیص کالا");
      }
    } catch {
      toast.error("خطا در تخصیص کالا");
    } finally {
      setAssigning(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const formatPrice = (price?: number) => {
    if (price == null) return "—";
    return price.toLocaleString("fa-IR");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-glacier">تخصیص کالا</DialogTitle>
          <DialogDescription className="text-fog/70">
            انتخاب کالا (محصول) از میان موجودی فروشندگان
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search + Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-fog/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  placeholder="جستجوی کالا..."
                  className="w-full h-9 pe-9 ps-9 rounded-sm border border-steel-border/60 bg-transparent text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <Button size="sm" onClick={() => handleSearch()} disabled={loading} className="shrink-0">
                {loading ? <Loader2 className="size-4 animate-spin" /> : "جستجو"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 me-auto">
                <span className="text-[11px] text-fog/50">مرتب‌سازی:</span>
                <button
                  type="button"
                  onClick={() => toggleSort("price")}
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-sm border flex items-center gap-1 transition-colors",
                    sortField === "price"
                      ? "border-electric-iris/30 bg-electric-iris/10 text-electric-iris"
                      : "border-steel-border/20 text-fog/50 hover:border-steel-border/40"
                  )}
                >
                  <ArrowUpDown className="size-3" />
                  قیمت {sortField === "price" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort("quantity")}
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-sm border flex items-center gap-1 transition-colors",
                    sortField === "quantity"
                      ? "border-electric-iris/30 bg-electric-iris/10 text-electric-iris"
                      : "border-steel-border/20 text-fog/50 hover:border-steel-border/40"
                  )}
                >
                  <ArrowUpDown className="size-3" />
                  تعداد {sortField === "quantity" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {loading ? (
              <p className="text-center text-fog/50 py-4">در حال جستجو...</p>
            ) : !searched ? (
              <p className="text-center text-fog/40 py-4">نام کالا را جستجو کنید</p>
            ) : items.length === 0 ? (
              <p className="text-center text-fog/50 py-4">کالایی یافت نشد</p>
            ) : (
              items.map((item) => {
                const unitPrice = item.price ?? 0;
                const totalPrice = quantity ? unitPrice * quantity : unitPrice;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setSelectedId(item._id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-start transition-all duration-200",
                      selectedId === item._id
                        ? "border-electric-iris/30 bg-electric-iris/5"
                        : "border-steel-border/20 bg-transparent hover:border-steel-border/40"
                    )}
                  >
                    <div className={cn(
                      "size-9 rounded-lg flex items-center justify-center shrink-0",
                      selectedId === item._id ? "bg-electric-iris/10" : "bg-white/[0.03]"
                    )}>
                      {selectedId === item._id ? (
                        <Check className="size-4 text-electric-iris" />
                      ) : (
                        <Package className="size-4 text-fog/50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-moonlight truncate">
                        {item.ware?.name || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {item.store?.name && (
                          <span className="text-[11px] text-fog/50">{item.store.name}</span>
                        )}
                        {item.ware?.brand && (
                          <span className="text-[11px] text-fog/40">{item.ware.brand}</span>
                        )}
                        {item.quantity != null && (
                          <span className="text-[11px] text-fog/40">تعداد: {item.quantity}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-sm font-medium text-moonlight" dir="ltr">
                        {formatPrice(unitPrice)} ریال
                      </p>
                      {quantity && quantity > 1 && (
                        <p className="text-[11px] text-fog/50 mt-0.5" dir="ltr">
                          مجموع: {formatPrice(totalPrice)} ریال
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {searched && items.length > 0 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={page <= 1 || loading}
                onClick={() => handleSearch(page - 1)}
              >
                قبلی
              </Button>
              <span className="text-xs text-fog/50">صفحه {page}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={!hasMore || loading}
                onClick={() => handleSearch(page + 1)}
              >
                بعدی
              </Button>
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
              disabled={!selectedId || assigning}
              className="gap-1.5"
            >
              {assigning ? <Loader2 className="size-4 animate-spin" /> : <Package className="size-4" />}
              {assigning ? "در حال تخصیص..." : "تخصیص کالا"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
