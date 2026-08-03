"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ReceiptText,
  ArrowRight,
  CalendarDays,
  BadgeCheck,
  Store,
  Building2,
  User as UserIcon,
  ShoppingCart,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { remove } from "@/app/actions/paymentOrder/remove";
import { markPaid } from "@/app/actions/paymentOrder/markPaid";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

export interface PaymentOrder {
  _id: string;
  title?: string;
  amount?: number;
  description?: string;
  status?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
  purchasingRequest?: { _id: string; title?: string };
  issuedBy?: { _id: string; first_name?: string; last_name?: string };
  approvedBy?: { _id: string; first_name?: string; last_name?: string };
  payTo?: { _id: string; name?: string };
  financialUnit?: { _id: string; name?: string };
}

function faDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function fullName(user?: { first_name?: string; last_name?: string }): string {
  if (!user) return "—"
  const name = `${user.first_name || ""} ${user.last_name || ""}`.trim()
  return name || "—"
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

export function PaymentOrderDetailClient({ item }: { item: PaymentOrder }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirmPay, setConfirmPay] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await remove({ _id: item._id });
      if (result.success) {
        toast.success("دستور پرداخت با موفقیت حذف شد");
        router.push("/admin/payment-orders");
      } else {
        toast.error(result.body?.message || "خطا در حذف دستور پرداخت");
        setDeleting(false);
        setConfirmDelete(false);
      }
    } catch {
      toast.error("خطا در حذف دستور پرداخت");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleMarkPaid = async () => {
    setPaying(true);
    try {
      const result = await markPaid(
        { activeRoleId: getActiveRoleIdFromStore(), _id: item._id },
        { _id: 1, status: 1, paidAt: 1 }
      );
      if (result.success) {
        toast.success("پرداخت با موفقیت ثبت شد");
        setConfirmPay(false);
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در ثبت پرداخت");
        setConfirmPay(false);
      }
    } catch {
      toast.error("خطا در ثبت پرداخت");
      setConfirmPay(false);
    } finally {
      setPaying(false);
    }
  };

  const canMarkPaid = item.status === "sent_to_finance";

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-steel-border/50">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/admin/payment-orders")}
              className="shrink-0 rounded-lg"
            >
              <ArrowRight className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-moonlight tracking-tight truncate">
                {item.title || "دستور پرداخت"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={item.status || "draft"} size="sm" />
                {item.purchasingRequest?.title && (
                  <span className="text-xs text-fog/50 truncate">{item.purchasingRequest.title}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              className="gap-2 px-4 text-ember hover:text-ember hover:bg-ember/5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-5" />
              حذف
            </Button>
            <Link href={`/admin/payment-orders/${item._id}/edit`}>
              <Button variant="ghost" className="gap-2 px-4">
                <Pencil className="size-5" />
                ویرایش
              </Button>
            </Link>
            {canMarkPaid && (
              <Button size="sm" className="gap-1.5" onClick={() => setConfirmPay(true)}>
                <BadgeCheck className="size-4" /> ثبت پرداخت
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-[1]">
        <div className="lg:col-span-2 space-y-6">
          {item.description && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle>توضیحات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-moonlight/80 leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle>اطلاعات پرداخت</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow
                  icon={ReceiptText}
                  label="مبلغ"
                  value={<span dir="ltr" className="font-mono">{item.amount?.toLocaleString("fa-IR") || "—"} ریال</span>}
                />
                <InfoRow
                  icon={ReceiptText}
                  label="وضعیت"
                  value={<StatusBadge status={item.status || "draft"} size="sm" />}
                />
                <InfoRow icon={ShoppingCart} label="درخواست خرید" value={item.purchasingRequest?.title || "—"} />
                <InfoRow icon={Store} label="دریافت‌کننده" value={item.payTo?.name || "—"} />
                <InfoRow icon={Building2} label="واحد مالی" value={item.financialUnit?.name || "—"} />
                <InfoRow icon={UserIcon} label="صادرکننده" value={fullName(item.issuedBy)} />
                <InfoRow icon={UserIcon} label="تأییدکننده" value={fullName(item.approvedBy)} />
                <InfoRow icon={CalendarDays} label="تاریخ پرداخت" value={faDate(item.paidAt)} />
                <InfoRow icon={CalendarDays} label="تاریخ ایجاد" value={faDate(item.createdAt)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(false) }}
        title="حذف دستور پرداخت"
        description={`آیا از حذف دستور پرداخت «${item.title || "این دستور"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ConfirmDialog
        open={confirmPay}
        onOpenChange={(open) => { if (!open) setConfirmPay(false) }}
        title="ثبت پرداخت"
        description={`آیا از پرداخت «${item.title || ""}» به مبلغ ${item.amount?.toLocaleString("fa-IR") || "۰"} ریال اطمینان دارید؟`}
        confirmLabel={paying ? "در حال ثبت..." : "تأیید پرداخت"}
        onConfirm={handleMarkPaid}
        loading={paying}
      />
    </div>
  )
}
