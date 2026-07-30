"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";

interface StockMovement {
  _id: string;
  quantity?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  reason?: string;
  description?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string };
  createdBy?: { _id: string; first_name?: string; last_name?: string };
  wareModel?: { _id: string; name?: string };
}

interface StockMovementsClientProps {
  items: StockMovement[];
  prevPageUrl: string;
  nextPageUrl: string;
  page: number;
  reasonFilter?: string;
}

const reasonLabels: Record<string, string> = {
  goods_receipt: "رسید کالا",
  goods_issue: "خروج کالا",
  transfer_in: "ورود انتقالی",
  transfer_out: "خروج انتقالی",
  consumption: "مصرف",
  adjustment: "تعدیل",
  return: "برگشت",
  write_off: "حذف",
};

const reasonColors: Record<string, string> = {
  goods_receipt: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  goods_issue: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  transfer_in: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  transfer_out: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  consumption: "text-red-400 bg-red-500/10 border-red-500/20",
  adjustment: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  return: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  write_off: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
};

const reasonOptions = Object.entries(reasonLabels).map(([value, label]) => ({ value, label }));

export function StockMovementsClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  reasonFilter = "",
}: StockMovementsClientProps) {
  const router = useRouter();

  const handleReasonFilter = useCallback((value: string | null) => {
    const params = new URLSearchParams();
    if (value) params.set("reason", value);
    router.push(`/admin/stock-movements${params.toString() ? `?${params.toString()}` : ""}`);
  }, [router]);

  const columns: Column<StockMovement>[] = [
    {
      key: "reason",
      label: "نوع",
      render: (item) => (
        <span className={cn(
          "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border",
          reasonColors[item.reason || ""] || "text-fog bg-white/[0.04] border-steel-border/20"
        )}>
          {item.reason === "consumption" || item.reason === "goods_issue" || item.reason === "transfer_out" || item.reason === "write_off" ? (
            <ArrowDownRight className="size-3" />
          ) : (
            <ArrowUpRight className="size-3" />
          )}
          {reasonLabels[item.reason || ""] || item.reason || "—"}
        </span>
      ),
    },
    {
      key: "wareModel",
      label: "کالا",
      render: (item) => (
        <span className="text-moonlight font-medium">{item.wareModel?.name || "—"}</span>
      ),
    },
    {
      key: "unit",
      label: "واحد",
      render: (item) => (
        <span className="text-fog text-sm">{item.unit?.name || "—"}</span>
      ),
    },
    {
      key: "quantity",
      label: "تغییر",
      render: (item) => {
        const isNegative = (item.quantity || 0) < 0;
        return (
          <span className={cn(
            "font-mono text-sm",
            isNegative ? "text-destructive" : "text-emerald-400"
          )} dir="ltr">
            {isNegative ? "" : "+"}{item.quantity?.toLocaleString("fa-IR") || "۰"}
          </span>
        );
      },
    },
    {
      key: "balance",
      label: "موجودی",
      render: (item) => (
        <span className="text-fog text-sm font-mono" dir="ltr">
          {item.balanceBefore?.toLocaleString("fa-IR") || "۰"} → {item.balanceAfter?.toLocaleString("fa-IR") || "۰"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "createdBy",
      label: "ثبت‌کننده",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.createdBy ? `${item.createdBy.first_name || ""} ${item.createdBy.last_name || ""}`.trim() || "—" : "—"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "createdAt",
      label: "تاریخ",
      render: (item) => (
        <span className="text-fog text-sm">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
      hideOnCard: true,
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <PageHeader title="گردش انبار" description="تاریخچه تغییرات موجودی انبار" />
      </div>

      <FilterBar
        search=""
        onSearchChange={() => {}}
        searchPlaceholder=""
        statusOptions={reasonOptions}
        status={reasonFilter}
        onStatusChange={handleReasonFilter}
        onReset={reasonFilter ? () => router.push("/admin/stock-movements") : undefined}
      />

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={false}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center shrink-0",
                  (item.quantity || 0) < 0 ? "bg-red-500/10" : "bg-emerald-500/10"
                )}>
                  <Activity className={cn(
                    "size-5",
                    (item.quantity || 0) < 0 ? "text-red-400" : "text-emerald-400"
                  )} />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.wareModel?.name || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border",
                      reasonColors[item.reason || ""] || "text-fog bg-white/[0.04] border-steel-border/20"
                    )}>
                      {reasonLabels[item.reason || ""] || item.reason || "—"}
                    </span>
                    <span className={cn(
                      "font-mono text-xs",
                      (item.quantity || 0) < 0 ? "text-destructive" : "text-emerald-400"
                    )} dir="ltr">
                      {(item.quantity || 0) < 0 ? "" : "+"}{item.quantity?.toLocaleString("fa-IR") || "۰"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-fog/40">
              {item.unit?.name && <span>{item.unit.name}</span>}
              {item.createdAt && <span>{new Date(item.createdAt).toLocaleDateString("fa-IR")}</span>}
            </div>
            {item.description && (
              <p className="text-xs text-fog/40 mt-1">{item.description}</p>
            )}
          </div>
        )}
        emptyTitle="حرکتی یافت نشد"
        emptyDescription="هنوز هیچ گردش انباری ثبت نشده است."
      />

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </div>
  );
}
