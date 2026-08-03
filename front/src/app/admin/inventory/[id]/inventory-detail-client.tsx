"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  ArrowRight,
  CalendarDays,
  Building2,
  Warehouse,
  MapPin,
  Barcode,
  Factory,
  FolderTree,
  Pencil,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SearchSelect } from "@/components/form/form-search-select";
import type { SearchSelectOption } from "@/components/form/form-search-select";
import { cn } from "@/lib/utils";
import { remove } from "@/app/actions/inventory/remove";
import { adjust } from "@/app/actions/inventory/adjust";
import { transferWithAudit } from "@/app/actions/inventory/transferWithAudit";
import { gets as getUnits } from "@/app/actions/unit/gets";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface Movement {
  _id: string;
  quantity?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  reason?: string;
  referenceType?: string;
  description?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string };
}

export interface Inventory {
  _id: string;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  batchNo?: string;
  expirationDate?: string;
  location?: string;
  lastCountedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  unit?: { _id: string; name?: string; type?: string };
  warehouseUnit?: { _id: string; name?: string; type?: string };
  ware?: { _id: string; name?: string; enName?: string; brand?: string };
  wareModel?: { _id: string; name?: string; enName?: string };
  wareGroup?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareType?: { _id: string; name?: string };
}

const REASON_LABELS: Record<string, string> = {
  goods_receipt: "رسید کالا",
  goods_issue: "صدور کالا",
  transfer_in: "ورود انتقالی",
  transfer_out: "خروج انتقالی",
  consumption: "مصرف",
  adjustment: "تعدیل",
  return: "مرجوعی",
  write_off: "اسقاط",
};

function faDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function faQty(value?: number): string {
  return value != null ? value.toLocaleString("fa-IR") : "—"
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

const unitFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getUnits({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1, type: 1 });
  if (!result.success || !result.body) return [];
  return (result.body as { _id: string; name?: string; type?: string }[]).map((s) => ({
    _id: s._id,
    name: s.name || "",
    sublabel: s.type,
  }));
};

export function InventoryDetailClient({ item, movements }: { item: Inventory; movements: Movement[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [toUnitId, setToUnitId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [transferring, setTransferring] = useState(false);

  const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: item._id });
      if (result.success) {
        toast.success("موجودی انبار با موفقیت حذف شد");
        router.push("/admin/inventory");
      } else {
        toast.error(result.body?.message || "خطا در حذف موجودی انبار");
        setDeleting(false);
        setConfirmDelete(false);
      }
    } catch {
      toast.error("خطا در حذف موجودی انبار");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjustQuantity) return;
    setAdjusting(true);
    try {
      const result = await adjust(
        { activeRoleId: getActiveRoleIdFromStore(), _id: item._id, quantity: Number(adjustQuantity), description: adjustDescription || undefined },
        { _id: 1, quantity: 1 }
      );
      if (result.success) {
        toast.success("موجودی با موفقیت تعدیل شد.");
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در تعدیل موجودی");
      }
    } catch {
      toast.error("خطا در تعدیل موجودی");
    } finally {
      setAdjusting(false);
    }
  };

  const handleTransfer = async () => {
    if (!toUnitId || !transferQuantity) return;
    setTransferring(true);
    try {
      const result = await transferWithAudit(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          fromUnitId: item.unit?._id || "",
          toUnitId,
          wareId: item.ware?._id || "",
          quantity: Number(transferQuantity),
          description: transferDescription || undefined,
        },
        { fromUnit: { _id: 1 }, toUnit: { _id: 1 }, quantity: 1 }
      );
      if (result.success) {
        toast.success("موجودی با موفقیت انتقال یافت.");
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در انتقال موجودی");
      }
    } catch {
      toast.error("خطا در انتقال موجودی");
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-steel-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/admin/inventory")}
              className="shrink-0 rounded-lg"
            >
              <ArrowRight className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-moonlight tracking-tight truncate">
                {item.ware?.name || item.wareModel?.name || "موجودی انبار"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {isLowStock && (
                  <Badge variant="outline" className="bg-ember/10 text-ember border-ember/20 text-[10px]">
                    کم‌موجودی
                  </Badge>
                )}
                <span className="text-xs text-fog/50 truncate">{item.unit?.name || "—"}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              className="gap-2 px-4 text-frost-link/80 hover:text-frost-link"
              onClick={() => { setAdjustQuantity(item.quantity?.toString() || ""); setAdjustDescription(""); setShowAdjust(true); }}
            >
              <RotateCcw className="size-5" />
              تعدیل
            </Button>
            <Button
              variant="ghost"
              className="gap-2 px-4 text-emerald-400/80 hover:text-emerald-400"
              onClick={() => { setToUnitId(""); setTransferQuantity(""); setTransferDescription(""); setShowTransfer(true); }}
            >
              <ArrowRightLeft className="size-5" />
              انتقال
            </Button>
            <Button
              variant="ghost"
              className="gap-2 px-4 text-ember hover:text-ember hover:bg-ember/5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-5" />
              حذف
            </Button>
            <Link href={`/admin/inventory/${item._id}/edit`}>
              <Button variant="ghost" className="gap-2 px-4">
                <Pencil className="size-5" />
                ویرایش
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-[1]">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Box className="size-4 text-electric-iris" />
                </div>
                <div>
                  <CardTitle>سطح موجودی</CardTitle>
                  <CardDescription>مقادیر فعلی، حداقل و حداکثر</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
                <div className={cn("min-w-0 p-5 text-center", isLowStock ? "bg-ember/[0.04]" : "bg-[#05060f]/60")}>
                  <p className="text-xs text-fog/60">موجودی فعلی</p>
                  <p className={cn("mt-2 text-3xl font-bold font-mono leading-9", isLowStock ? "text-ember" : "text-glacier")}>
                    {faQty(item.quantity)}
                  </p>
                </div>
                <div className="min-w-0 bg-[#05060f]/60 p-5 text-center">
                  <p className="text-xs text-fog/60">حداقل</p>
                  <p className="mt-2 text-2xl font-semibold font-mono leading-9 text-fog/80">{faQty(item.minQuantity)}</p>
                </div>
                <div className="min-w-0 bg-[#05060f]/60 p-5 text-center">
                  <p className="text-xs text-fog/60">حداکثر</p>
                  <p className="mt-2 text-2xl font-semibold font-mono leading-9 text-fog/80">{faQty(item.maxQuantity)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-frost-link/10 flex items-center justify-center">
                  <ArrowUpCircle className="size-4 text-frost-link" />
                </div>
                <div>
                  <CardTitle>گردش انبار</CardTitle>
                  <CardDescription>{movements.length.toLocaleString("fa-IR")} حرکت اخیر</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-sm text-fog/50 text-center py-4">هیچ گردشی برای این کالا ثبت نشده است.</p>
              ) : (
                <div className="space-y-2.5">
                  {movements.map((movement) => {
                    const positive = (movement.quantity || 0) >= 0;
                    const Icon = positive ? ArrowDownCircle : ArrowUpCircle;
                    return (
                      <div key={movement._id} className="flex items-center gap-3 p-3 rounded-lg border border-steel-border/20 bg-white/[0.02]">
                        <div className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                          positive ? "bg-emerald-500/10 ring-emerald-500/20" : "bg-rose-500/10 ring-rose-500/20",
                        )}>
                          <Icon className={cn("size-5", positive ? "text-emerald-400" : "text-rose-400")} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-moonlight truncate">
                              {REASON_LABELS[movement.reason || ""] || movement.reason || "—"}
                            </p>
                            <span className="text-xs text-fog/50">{movement.unit?.name || ""}</span>
                          </div>
                          {movement.description && (
                            <p className="text-xs text-fog/60 truncate">{movement.description}</p>
                          )}
                          <p className="text-[10px] text-fog/40 mt-0.5">{faDate(movement.createdAt)}</p>
                        </div>
                        <div className="text-end shrink-0">
                          <p className={cn("text-sm font-semibold font-mono", positive ? "text-emerald-400" : "text-rose-400")} dir="ltr">
                            {positive ? "+" : ""}{faQty(movement.quantity)}
                          </p>
                          <p className="text-[10px] text-fog/40 font-mono" dir="ltr">
                            {faQty(movement.balanceBefore)} ← {faQty(movement.balanceAfter)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>مشخصات کالا</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow icon={Box} label="کالا" value={item.ware?.name || "—"} />
                {item.ware?.brand && (
                  <InfoRow icon={Factory} label="برند" value={item.ware.brand} />
                )}
                {item.wareModel?.name && (
                  <InfoRow icon={FolderTree} label="مدل کالا" value={item.wareModel.name} />
                )}
                {(item.wareType?.name || item.wareClass?.name || item.wareGroup?.name) && (
                  <InfoRow
                    icon={FolderTree}
                    label="دسته‌بندی"
                    value={[item.wareType?.name, item.wareClass?.name, item.wareGroup?.name].filter(Boolean).join(" / ") || "—"}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>اطلاعات موجودی</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow icon={Building2} label="واحد مصرف‌کننده" value={item.unit?.name || "—"} />
                <InfoRow icon={Warehouse} label="انبار" value={item.warehouseUnit?.name || "—"} />
                <InfoRow icon={Barcode} label="شماره سریال" value={<span dir="ltr" className="font-mono">{item.batchNo || "—"}</span>} />
                <InfoRow icon={MapPin} label="موقعیت" value={item.location || "—"} />
                <InfoRow icon={CalendarDays} label="تاریخ انقضا" value={faDate(item.expirationDate)} />
                <InfoRow icon={CalendarDays} label="آخرین شمارش" value={faDate(item.lastCountedAt)} />
                <InfoRow icon={CalendarDays} label="تاریخ ثبت" value={faDate(item.createdAt)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(false) }}
        title="حذف موجودی انبار"
        description={`آیا از حذف موجودی «${item.ware?.name || item.wareModel?.name || "این کالا"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />

      <Dialog open={showAdjust} onOpenChange={setShowAdjust}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">تعدیل موجودی</DialogTitle>
            <DialogDescription className="text-fog/70">
              {item.ware?.name || item.wareModel?.name || ""}
              {" — "}موجودی فعلی: {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "۰"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">تعداد جدید</label>
              <input
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                className="w-full h-10 rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="تعداد جدید را وارد کنید"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">توضیحات تعدیل</label>
              <textarea
                value={adjustDescription}
                onChange={(e) => setAdjustDescription(e.target.value)}
                className="w-full rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 py-2 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                rows={2}
                placeholder="دلیل تعدیل..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowAdjust(false)} disabled={adjusting}>
                انصراف
              </Button>
              <Button
                type="button"
                onClick={handleAdjust}
                disabled={adjusting || !adjustQuantity}
                className="gap-1.5"
              >
                {adjusting ? "در حال تعدیل..." : "تأیید تعدیل"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-glacier">انتقال موجودی</DialogTitle>
            <DialogDescription className="text-fog/70">
              {item.ware?.name || item.wareModel?.name || ""}
              {" — "}موجودی فعلی: {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "۰"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">واحد مقصد</label>
              <SearchSelect
                value={toUnitId}
                onChange={setToUnitId}
                fetcher={unitFetcher}
                placeholder="واحد مقصد را انتخاب کنید..."
                label="واحد مقصد"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">تعداد انتقال</label>
              <input
                type="number"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                className="w-full h-10 rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                placeholder="تعداد را وارد کنید"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-moonlight mb-1.5">توضیحات انتقال</label>
              <textarea
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                className="w-full rounded-sm border border-steel-border/60 bg-white/[0.02] px-3 py-2 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
                rows={2}
                placeholder="دلیل انتقال..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setShowTransfer(false)} disabled={transferring}>
                انصراف
              </Button>
              <Button
                type="button"
                onClick={handleTransfer}
                disabled={transferring || !toUnitId || !transferQuantity}
                className="gap-1.5"
              >
                {transferring ? "در حال انتقال..." : "انتقال"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
