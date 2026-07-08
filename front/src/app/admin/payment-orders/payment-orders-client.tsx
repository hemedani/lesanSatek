"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { markPaid } from "@/app/actions/paymentOrder/markPaid";

interface PaymentOrder {
  _id: string;
  title?: string;
  amount?: number;
  status?: string;
  description?: string;
  paidAt?: string;
  createdAt?: string;
}

interface PaymentOrdersClientProps {
  items: PaymentOrder[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  search?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "پیش‌نویس", className: "bg-white/5 text-fog/70 border-steel-border/40" },
  sent_to_finance: { label: "ارسال به مالی", className: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  paid: { label: "پرداخت شده", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "لغو شده", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export function PaymentOrdersClient({ items, prevPageUrl, nextPageUrl, page, search = "" }: PaymentOrdersClientProps) {
  const router = useRouter();
  const [payTarget, setPayTarget] = useState<PaymentOrder | null>(null);
  const [paying, setPaying] = useState(false);

  const handleSearch = useCallback((value: string) => {
    router.push(`/admin/payment-orders${value.trim() ? `?search=${encodeURIComponent(value.trim())}` : ""}`);
  }, [router]);

  const handleMarkPaid = async () => {
    if (!payTarget) return;
    setPaying(true);
    try {
      const result = await markPaid({ activeRoleId: getActiveRoleIdFromStore(), _id: payTarget._id }, { _id: 1, status: 1 });
      if (result.success) {
        toast.success("پرداخت با موفقیت ثبت شد.");
        setPayTarget(null);
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در ثبت پرداخت");
      }
    } catch {
      toast.error("خطا در ثبت پرداخت");
    } finally {
      setPaying(false);
    }
  };

  const columns: Column<PaymentOrder>[] = [
    {
      key: "title",
      label: "عنوان",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="size-6 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
            <Receipt className="size-3.5 text-electric-iris" />
          </div>
          <span className="text-moonlight font-medium">{item.title || "—"}</span>
        </div>
      ),
    },
    {
      key: "amount",
      label: "مبلغ",
      render: (item) => (
        <span className="text-fog font-mono text-sm" dir="ltr">
          {item.amount != null ? item.amount.toLocaleString("fa-IR") : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "وضعیت",
      render: (item) => {
        const config = statusConfig[item.status || ""] || statusConfig.draft;
        return <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5 font-medium", config.className)}>{config.label}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "تاریخ ایجاد",
      render: (item) => (
        <span className="text-fog text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}</span>
      ),
      hideOnCard: true,
    },
    {
      key: "actions",
      label: "",
      render: (item) => {
        if (item.status !== "sent_to_finance") return null;
        return (
          <Button variant="ghost" size="icon-xs" className="opacity-60 group-hover/row:opacity-100 text-emerald-400/60 hover:text-emerald-400" onClick={() => setPayTarget(item)}>
            <Check className="size-3.5" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader title="دستورات پرداخت" description="مدیریت پرداخت‌ها" />
      </div>
      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی دستور پرداخت..." />
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={false}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Receipt className="size-5 text-electric-iris" />
              <span className="font-semibold text-moonlight">{item.title || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-fog/50">
              {item.status && <Badge variant="outline" className={cn("text-[10px]", (statusConfig[item.status] || statusConfig.draft).className)}>{statusConfig[item.status]?.label || item.status}</Badge>}
              {item.amount != null && <span dir="ltr">{item.amount.toLocaleString("fa-IR")} ریال</span>}
            </div>
          </div>
        )}
        emptyTitle="دستور پرداختی یافت نشد"
        emptyDescription="هنوز هیچ دستور پرداختی ثبت نشده است."
      />
      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />

      <ConfirmDialog
        open={!!payTarget}
        onOpenChange={(open) => { if (!open) setPayTarget(null); }}
        title="ثبت پرداخت"
        description={`آیا از پرداخت "${payTarget?.title || ""}" به مبلغ ${payTarget?.amount?.toLocaleString("fa-IR") || "۰"} ریال اطمینان دارید؟`}
        confirmLabel={paying ? "در حال ثبت..." : "تأیید پرداخت"}
        onConfirm={handleMarkPaid}
        loading={paying}
      />
    </div>
  );
}
