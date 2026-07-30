"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Activity, User, Building2, Store, MessageSquareText, CalendarDays, FolderTree, Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import type { Column } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { Badge } from "@/components/ui/badge";

interface StockMovement {
  _id: string;
  quantity?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  reason?: string;
  description?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string; type?: string };
  createdBy?: { _id: string; first_name?: string; last_name?: string };
  store?: { _id: string; name?: string };
  ware?: { _id: string; name?: string; enName?: string; brand?: string };
  wareModel?: { _id: string; name?: string; enName?: string };
  wareGroup?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareType?: { _id: string; name?: string };
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

const reasonStyle: Record<string, string> = {
  goods_receipt: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  goods_issue: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  transfer_in: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  transfer_out: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  consumption: "bg-red-500/10 text-red-400 border-red-500/20",
  adjustment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  return: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  write_off: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const reasonOptions = Object.entries(reasonLabels).map(([value, label]) => ({ value, label }));

function ReasonBadge({ reason }: { reason?: string }) {
  const style = reasonStyle[reason || ""] || "bg-white/[0.04] text-fog border-white/[0.06]";
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", style)}>
      {reasonLabels[reason || ""] || reason || "—"}
    </Badge>
  )
}

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
      key: "ware",
      label: "کالا",
      render: (item) => (
        <div className="flex items-center gap-3 min-w-0 max-w-[280px]">
          <div className={cn(
            "size-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
            (item.quantity || 0) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
          )}>
            <Activity className={cn("size-4", (item.quantity || 0) >= 0 ? "text-emerald-400" : "text-red-400")} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium text-moonlight truncate leading-5 block">
              {item.ware?.name || item.wareModel?.name || "—"}
            </span>
            {item.ware?.brand && (
              <p className="text-[10px] text-fog/40 truncate leading-4">{item.ware.brand}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "reason",
      label: "نوع",
      render: (item) => <ReasonBadge reason={item.reason} />,
    },
    {
      key: "unit",
      label: "واحد",
      render: (item) => (
        <span className="text-xs text-fog">{item.unit?.name || "—"}</span>
      ),
    },
    {
      key: "quantity",
      label: "تغییر",
      render: (item) => {
        const isNegative = (item.quantity || 0) < 0;
        return (
          <span className={cn("text-sm font-bold font-mono", isNegative ? "text-red-400" : "text-emerald-400")} dir="ltr">
            {isNegative ? "" : "+"}{item.quantity?.toLocaleString("fa-IR") || "۰"}
          </span>
        );
      },
    },
    {
      key: "balance",
      label: "موجودی",
      render: (item) => (
        <span className="text-xs text-fog font-mono" dir="ltr">
          {item.balanceBefore?.toLocaleString("fa-IR") || "۰"} → {item.balanceAfter?.toLocaleString("fa-IR") || "۰"}
        </span>
      ),
      hideOnCard: true,
    },
    {
      key: "createdBy",
      label: "ثبت‌کننده",
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog">
          {item.createdBy ? `${item.createdBy.first_name || ""} ${item.createdBy.last_name || ""}`.trim() || "—" : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "تاریخ",
      hideOnCard: true,
      render: (item) => (
        <span className="text-xs text-fog">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
        </span>
      ),
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
        renderCard={(item) => {
          const isNeg = (item.quantity || 0) < 0
          return (
            <div className="glass-card glass-card-hover-active rounded-xl overflow-hidden transition-all duration-200">
              <div className={cn(
                "flex items-center gap-3 p-4 border-b",
                isNeg ? "border-red-500/10 bg-red-500/[0.02]" : "border-emerald-500/10 bg-emerald-500/[0.02]",
              )}>
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
                  isNeg ? "bg-red-500/10" : "bg-emerald-500/10",
                )}>
                  <Activity className={cn("size-5", isNeg ? "text-red-400" : "text-emerald-400")} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-moonlight truncate leading-5">
                      {item.ware?.name || item.wareModel?.name || "—"}
                    </p>
                    <ReasonBadge reason={item.reason} />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.ware?.brand && (
                      <span className="text-[10px] text-fog/50 flex items-center gap-1">
                        <Factory className="size-3" />
                        {item.ware.brand}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">تغییر</p>
                  <p className={cn("text-lg font-bold font-mono leading-7", isNeg ? "text-red-400" : "text-emerald-400")} dir="ltr">
                    {isNeg ? "" : "+"}{(item.quantity ?? 0).toLocaleString("fa-IR")}
                  </p>
                </div>
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">قبل → بعد</p>
                  <p className="text-sm font-mono text-fog leading-7" dir="ltr">
                    {item.balanceBefore?.toLocaleString("fa-IR") || "۰"} → {item.balanceAfter?.toLocaleString("fa-IR") || "۰"}
                  </p>
                </div>
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">تاریخ</p>
                  <p className="text-sm font-medium text-moonlight leading-7">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-1">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">واحد</p>
                      <p className="text-xs text-moonlight truncate">{item.unit?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">ثبت‌کننده</p>
                      <p className="text-xs text-moonlight truncate">
                        {item.createdBy ? `${item.createdBy.first_name || ""} ${item.createdBy.last_name || ""}`.trim() || "—" : "—"}
                      </p>
                    </div>
                  </div>
                  {item.store?.name && (
                    <div className="flex items-center gap-2">
                      <Store className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">انبار</p>
                        <p className="text-xs text-moonlight truncate">{item.store.name}</p>
                      </div>
                    </div>
                  )}
                  {item.description && (
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">توضیحات</p>
                        <p className="text-xs text-moonlight truncate">{item.description}</p>
                      </div>
                    </div>
                  )}
                </div>

                {(item.wareType?.name || item.wareClass?.name || item.wareGroup?.name) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-white/[0.04]">
                    <FolderTree className="size-3 text-fog/30" />
                    {item.wareType?.name && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                        {item.wareType.name}
                      </Badge>
                    )}
                    {item.wareClass?.name && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                        {item.wareClass.name}
                      </Badge>
                    )}
                    {item.wareGroup?.name && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                        {item.wareGroup.name}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        }}
        emptyTitle="حرکتی یافت نشد"
        emptyDescription="هنوز هیچ گردش انباری ثبت نشده است."
      />

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </div>
  );
}
