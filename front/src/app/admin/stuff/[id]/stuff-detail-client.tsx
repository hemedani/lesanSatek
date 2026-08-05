"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ArrowRight,
  CalendarDays,
  Store as StoreIcon,
  Factory,
  FolderTree,
  Pencil,
  Trash2,
  Barcode,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HelpLauncher } from "@/components/help/help-launcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { remove } from "@/app/actions/stuff/remove";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

export interface StuffDetail {
  _id: string;
  quantity?: number;
  price?: number;
  hasAbsolutePrice?: boolean;
  pricePercentage?: number;
  expiration?: string;
  barcode?: number;
  qrc?: string;
  isExpirationNear?: boolean;
  createdAt?: string;
  updatedAt?: string;
  ware?: { _id: string; name?: string; enName?: string; brand?: string };
  store?: { _id: string; name?: string; address?: string };
  wareType?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareGroup?: { _id: string; name?: string };
  wareModel?: { _id: string; name?: string };
}

function faDate(iso?: string): string {
  if (!iso) return "—";
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

export function StuffDetailClient({ item }: { item: StuffDetail }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isPercent = !item.hasAbsolutePrice;
  const categoryName = item.wareType?.name || item.wareClass?.name || item.wareGroup?.name;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: item._id });
      if (result.success) {
        toast.success("موجودی با موفقیت حذف شد");
        router.push("/admin/stuff");
      } else {
        toast.error(result.body?.message || "خطا در حذف موجودی");
        setDeleting(false);
        setConfirmDelete(false);
      }
    } catch {
      toast.error("خطا در حذف موجودی");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-steel-border/50">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/admin/stuff")}
            className="shrink-0 rounded-lg"
          >
            <ArrowRight className="size-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-moonlight tracking-tight truncate">
              {item.ware?.name || "موجودی فروشگاه"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {isPercent ? (
                <Badge variant="outline" className="bg-electric-iris/10 text-electric-iris border-electric-iris/20 text-[10px]">
                  قیمت‌گذاری درصدی
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                  قیمت مطلق
                </Badge>
              )}
              {item.isExpirationNear && (
                <Badge variant="outline" className="bg-ember/10 text-ember border-ember/20 text-[10px]">
                  انقضا نزدیک
                </Badge>
              )}
              <span className="text-xs text-fog/50 truncate">{item.store?.name || "—"}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <HelpLauncher topicId="admin-stuff" tooltip="راهنمای موجودی فروشگاه" />
          <Button
            variant="ghost"
            className="gap-2 px-4 text-ember hover:text-ember hover:bg-ember/5"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-5" />
            حذف
          </Button>
          <Link href={`/admin/stuff/${item._id}/edit`}>
            <Button variant="ghost" className="gap-2 px-4">
              <Pencil className="size-5" />
              ویرایش
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Package className="size-4 text-electric-iris" />
                </div>
                <div>
                  <CardTitle>موجودی و قیمت</CardTitle>
                  <CardDescription>مقادیر فعلی و نحوه قیمت‌گذاری</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
                <div className="min-w-0 bg-[#05060f]/60 p-5 text-center">
                  <p className="text-xs text-fog/60">موجودی</p>
                  <p className="mt-2 text-3xl font-bold font-mono leading-9 text-glacier" dir="ltr">
                    {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "۰"}
                  </p>
                </div>
                <div className="min-w-0 bg-[#05060f]/60 p-5 text-center">
                  <p className="text-xs text-fog/60">{isPercent ? "درصد افزایش" : "قیمت نهایی (ریال)"}</p>
                  <p className={cn("mt-2 text-2xl font-semibold font-mono leading-9", isPercent ? "text-electric-iris" : "text-fog/80")} dir="ltr">
                    {isPercent
                      ? item.pricePercentage != null ? `٪${item.pricePercentage.toLocaleString("fa-IR")}` : "—"
                      : item.price != null ? item.price.toLocaleString("fa-IR") : "—"}
                  </p>
                </div>
              </div>
              {isPercent && item.price != null && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-sm">
                  <Wallet className="size-4 shrink-0 text-emerald-400" />
                  <span className="text-fog/70">قیمت نهایی محاسبه‌شده</span>
                  <span className="ms-auto font-mono text-emerald-400" dir="ltr">{item.price.toLocaleString("fa-IR")} ریال</span>
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
                <InfoRow icon={Package} label="کالا" value={item.ware?.name || "—"} />
                {item.ware?.brand && (
                  <InfoRow icon={Factory} label="برند" value={item.ware.brand} />
                )}
                {item.wareModel?.name && (
                  <InfoRow icon={FolderTree} label="مدل کالا" value={item.wareModel.name} />
                )}
                {categoryName && (
                  <InfoRow
                    icon={FolderTree}
                    label="دسته‌بندی"
                    value={[item.wareType?.name, item.wareClass?.name, item.wareGroup?.name].filter(Boolean).join(" / ")}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>اطلاعات فروشگاه</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow icon={StoreIcon} label="فروشگاه" value={item.store?.name || "—"} />
                {item.store?.address && (
                  <InfoRow icon={StoreIcon} label="آدرس" value={item.store.address} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>جزئیات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow icon={CalendarDays} label="تاریخ انقضا" value={faDate(item.expiration)} />
                {item.barcode != null && (
                  <InfoRow icon={Barcode} label="بارکد" value={<span dir="ltr" className="font-mono">{item.barcode}</span>} />
                )}
                {item.qrc && (
                  <InfoRow icon={Barcode} label="QR کد" value={<span dir="ltr" className="font-mono">{item.qrc}</span>} />
                )}
                <InfoRow icon={CalendarDays} label="تاریخ ثبت" value={faDate(item.createdAt)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(false) }}
        title="حذف موجودی"
        description={`آیا از حذف موجودی «${item.ware?.name || "این کالا"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}