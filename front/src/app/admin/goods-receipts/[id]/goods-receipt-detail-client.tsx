"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  ArrowRight,
  CalendarDays,
  Package,
  ShoppingCart,
  Pencil,
  Trash2,
  Building2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HelpLauncher } from "@/components/help/help-launcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { remove } from "@/app/actions/goodsReceipt/remove";

interface GoodsReceiptItem {
  _id?: string;
  wareModelName?: string;
  wareName?: string;
  wareId?: string;
  quantityReceived?: number;
  quantityAccepted?: number;
  quantityRejected?: number;
  batchNo?: string;
  expirationDate?: string;
}

export interface GoodsReceipt {
  _id: string;
  receiptNumber?: string;
  description?: string;
  receivedAt?: string;
  status?: string;
  notes?: string;
  items?: GoodsReceiptItem[];
  createdAt?: string;
  updatedAt?: string;
  purchasingRequest?: { _id: string; title?: string };
  receivedBy?: { _id: string; first_name?: string; last_name?: string };
  receivingUnit?: { _id: string; name?: string };
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

export function GoodsReceiptDetailClient({ receipt }: { receipt: GoodsReceipt }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await remove({ _id: receipt._id });
      if (result.success) {
        toast.success("رسید کالا با موفقیت حذف شد");
        router.push("/admin/goods-receipts");
      } else {
        toast.error(result.body?.message || "خطا در حذف رسید کالا");
        setDeleting(false);
        setConfirmDelete(false);
      }
    } catch {
      toast.error("خطا در حذف رسید کالا");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const receivedBy =
    receipt.receivedBy?.first_name || receipt.receivedBy?.last_name
      ? `${receipt.receivedBy.first_name || ""} ${receipt.receivedBy.last_name || ""}`.trim()
      : ""

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-steel-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/admin/goods-receipts")}
              className="shrink-0 rounded-lg"
            >
              <ArrowRight className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-moonlight tracking-tight truncate">
                {receipt.receiptNumber || "رسید کالا"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={receipt.status || "pending"} size="sm" />
                {receipt.purchasingRequest?.title && (
                  <span className="text-xs text-fog/50 truncate">{receipt.purchasingRequest.title}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <HelpLauncher topicId="admin-goods-receipts" tooltip="راهنمای رسید کالا" />
            <Button
              variant="ghost"
              className="gap-2 px-4 text-ember hover:text-ember hover:bg-ember/5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-5" />
              حذف
            </Button>
            <Link href={`/admin/goods-receipts/${receipt._id}/edit`}>
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
          {receipt.description && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle>توضیحات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-moonlight/80 leading-relaxed">{receipt.description}</p>
              </CardContent>
            </Card>
          )}

          {receipt.notes && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle>یادداشت‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-moonlight/80 leading-relaxed">{receipt.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Package className="size-4 text-electric-iris" />
                </div>
                <div>
                  <CardTitle>آیتم‌های رسید</CardTitle>
                  <CardDescription>
                    {(receipt.items?.length || 0).toLocaleString("fa-IR")} قلم کالا
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!receipt.items || receipt.items.length === 0 ? (
                <p className="text-sm text-fog/50 text-center py-4">هیچ آیتمی در این رسید ثبت نشده است.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-steel-border/20 text-right text-xs text-fog/50">
                        <th className="pb-2 ps-1 pe-3">کالا</th>
                        <th className="pb-2 px-3">دریافتی</th>
                        <th className="pb-2 px-3">قبول</th>
                        <th className="pb-2 px-3">رد</th>
                        <th className="pb-2 px-3">شماره بچ</th>
                        <th className="pb-2 ps-3 pe-1">تاریخ انقضا</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.items.map((item, index) => (
                        <tr key={item._id || index} className="border-b border-steel-border/10 last:border-b-0">
                          <td className="py-3 ps-1 pe-3 font-medium text-moonlight">
                            {item.wareModelName || item.wareName || "—"}
                          </td>
                          <td className="py-3 px-3 text-fog/80">{item.quantityReceived?.toLocaleString("fa-IR") || "—"}</td>
                          <td className="py-3 px-3 text-fog/80">{item.quantityAccepted?.toLocaleString("fa-IR") || "—"}</td>
                          <td className="py-3 px-3 text-fog/80">{item.quantityRejected?.toLocaleString("fa-IR") || "—"}</td>
                          <td className="py-3 px-3 text-fog/80" dir="ltr">{item.batchNo || "—"}</td>
                          <td className="py-3 ps-3 pe-1 text-fog/80">{faDate(item.expirationDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>اطلاعات رسید</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow icon={CalendarDays} label="تاریخ رسید" value={<span className="font-mono">{faDate(receipt.receivedAt)}</span>} />
                <InfoRow
                  icon={ClipboardList}
                  label="وضعیت"
                  value={<StatusBadge status={receipt.status || "pending"} size="sm" />}
                />
                <InfoRow icon={ShoppingCart} label="درخواست خرید" value={receipt.purchasingRequest?.title || "—"} />
                <InfoRow icon={Building2} label="واحد دریافت‌کننده" value={receipt.receivingUnit?.name || "—"} />
                <InfoRow icon={UserIcon} label="دریافت‌کننده" value={receivedBy || "—"} />
                <InfoRow icon={CalendarDays} label="تاریخ ثبت" value={faDate(receipt.createdAt)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(false) }}
        title="حذف رسید کالا"
        description={`آیا از حذف رسید «${receipt.receiptNumber || "این رسید"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
