"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Activity, Factory, FolderTree, Building2, User, MessageSquareText, Box, ArrowDownUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { HelpLauncher } from "@/components/help/help-launcher";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FilterOption } from "@/components/ui/filter-select";

export interface StockMovement {
  _id: string;
  quantity?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  reason?: string;
  referenceType?: string;
  description?: string;
  createdAt?: string;
  unit?: { _id: string; name?: string; type?: string };
  createdBy?: { _id: string; first_name?: string; last_name?: string };
  store?: { _id: string; name?: string };
  ware?: { _id: string; name?: string; enName?: string; brand?: string };
  wareModel?: { _id: string; name?: string };
  wareGroup?: { _id: string; name?: string };
  wareClass?: { _id: string; name?: string };
  wareType?: { _id: string; name?: string };
}

interface StockMovementsClientProps {
  items: StockMovement[];
  prevUrl: string;
  nextUrl: string;
  page: number;
  totalPages: number;
  total: number;
  reason: string;
  sort: string;
}

const reasonLabels: Record<string, string> = {
  goods_receipt: "رسید کالا",
  goods_issue: "خروج کالا",
  transfer_in: "ورود انتقالی",
  transfer_out: "خروج انتقالی",
  consumption: "مصرف",
  adjustment: "تعدیل",
  return: "برگشت",
  write_off: "اسقاط",
};

type ReasonStyle = { badge: string; tone: string };
const reasonStyle: Record<string, ReasonStyle> = {
  goods_receipt: { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", tone: "from-emerald-500/25 to-emerald-500/5" },
  goods_issue: { badge: "bg-rose-500/10 text-rose-400 border-rose-500/20", tone: "from-rose-500/25 to-rose-500/5" },
  transfer_in: { badge: "bg-sky-500/10 text-sky-400 border-sky-500/20", tone: "from-sky-500/25 to-sky-500/5" },
  transfer_out: { badge: "bg-orange-500/10 text-orange-400 border-orange-500/20", tone: "from-orange-500/25 to-orange-500/5" },
  consumption: { badge: "bg-red-500/10 text-red-400 border-red-500/20", tone: "from-red-500/25 to-red-500/5" },
  adjustment: { badge: "bg-amber-500/10 text-amber-400 border-amber-500/20", tone: "from-amber-500/25 to-amber-500/5" },
  return: { badge: "bg-purple-500/10 text-purple-400 border-purple-500/20", tone: "from-purple-500/25 to-purple-500/5" },
  write_off: { badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", tone: "from-zinc-500/25 to-zinc-500/5" },
};

const reasonOptions: FilterOption[] = Object.entries(reasonLabels).map(([value, label]) => ({ value, label }));

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "quantity-desc", label: "بیشترین تغییر" },
  { value: "quantity-asc", label: "کمترین تغییر" },
];

function faDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function faQty(value?: number): string {
  return value != null ? value.toLocaleString("fa-IR") : "۰"
}

function SignedQty({ value, className }: { value?: number; className?: string }) {
  const isNegative = (value || 0) < 0;
  return (
    <span dir="ltr" className={cn("font-mono font-bold", isNegative ? "text-ember" : "text-emerald-400", className)}>
      {isNegative ? "" : "+"}{faQty(value)}
    </span>
  );
}

function ReasonBadge({ reason }: { reason?: string }) {
  const style = reasonStyle[reason || ""]?.badge || "bg-white/[0.04] text-fog border-white/[0.06]";
  return (
    <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px] gap-1", style)}>
      <Activity className="size-3" />
      {reasonLabels[reason || ""] || reason || "—"}
    </Badge>
  );
}

function MovementCard({ item }: { item: StockMovement }) {
  const isNegative = (item.quantity || 0) < 0;
  const categoryName = item.wareType?.name || item.wareClass?.name || item.wareGroup?.name;
  const createdByName = item.createdBy
    ? `${item.createdBy.first_name || ""} ${item.createdBy.last_name || ""}`.trim()
    : "";

  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-inset ring-white/[0.06]",
            isNegative ? "from-ember/20 to-ember/5" : "from-emerald-500/25 to-emerald-500/5")}
          >
            <ArrowDownUp className={cn("size-5", isNegative ? "text-ember" : "text-emerald-400")} />
          </div>
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-moonlight" title={item.ware?.name || item.wareModel?.name}>
                {item.ware?.name || item.wareModel?.name || "—"}
              </p>
              <ReasonBadge reason={item.reason} />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-fog/60">
              {item.ware?.brand && (
                <span className="inline-flex items-center gap-1">
                  <Factory className="size-4" />
                  {item.ware.brand}
                </span>
              )}
              {categoryName && (
                <span className="inline-flex items-center gap-1">
                  <FolderTree className="size-4" />
                  {categoryName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">تغییر</p>
          <SignedQty value={item.quantity} className="mt-1 truncate text-sm leading-6" />
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">قبل → بعد</p>
          <p className="mt-1 truncate text-sm font-medium leading-6 font-mono text-fog/80" dir="ltr">
            {faQty(item.balanceBefore)} → {faQty(item.balanceAfter)}
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">تاریخ</p>
          <p className="mt-1 truncate text-xs font-medium leading-6 text-moonlight">{faDate(item.createdAt)}</p>
        </div>
      </div>

      <div className="space-y-2 text-body-sm text-fog/70">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Building2 className="size-4 shrink-0 text-fog/60" />
          <span className="truncate">{item.unit?.name || "—"}</span>
        </span>
        {createdByName && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <User className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{createdByName}</span>
          </span>
        )}
        {item.description && (
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MessageSquareText className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{item.description}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function StockMovementsClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  reason,
  sort,
}: StockMovementsClientProps) {
  const router = useRouter();

  const makeParams = useCallback(
    (next: { reason?: string; sort?: string }) => {
      const params = new URLSearchParams();
      const nextReason = next.reason ?? reason;
      const nextSort = next.sort ?? sort;
      if (nextReason) params.set("reason", nextReason);
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort);
      return params.toString();
    },
    [reason, sort],
  );

  const go = useCallback((qs: string) => router.push(`/admin/stock-movements${qs ? `?${qs}` : ""}`), [router]);

  const handleReason = (value: string | null) => go(makeParams({ reason: value ?? "" }));
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }));
  const handleReset = () => router.push("/admin/stock-movements");

  const hasFilters = Boolean(reason || (sort && sort !== "createdAt-desc"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="گردش انبار"
        description="تاریخچه ثبت خودکار تغییرات موجودی کالا در واحدها و انبارها"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} گردش
        </span>
        <HelpLauncher topicId="admin-stock-movements" tooltip="راهنمای گردش انبار" />
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={Activity}
            placeholder="نوع گردش"
            ariaLabel="فیلتر نوع گردش"
            value={reason}
            onValueChange={handleReason}
            options={reasonOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش گردش‌ها"
            value={sort}
            onValueChange={handleSort}
            options={sortOptions}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-11 gap-2 rounded-sm px-4 text-body-sm text-moonlight"
            >
              <RotateCcw className="size-5" strokeWidth={2} />
              پاک کردن فیلترها
            </Button>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <MovementCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Box}
          title={hasFilters ? "گردشی یافت نشد" : "هنوز گردشی ثبت نشده است"}
          description={
            hasFilters
              ? "با تغییر نوع گردش یا مرتب‌سازی، گردش موردنظر را پیدا کنید."
              : "با ثبت موجودی، انتقال، تعدیل یا مصرف، گردش‌های انبار به‌صورت خودکار ثبت می‌شوند."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : undefined
          }
        />
      )}

      {(prevUrl || nextUrl) && (
        <Pagination
          prevUrl={prevUrl}
          nextUrl={nextUrl}
          page={page}
          totalPages={totalPages}
          className="border-t border-steel-border/15 pt-2"
        />
      )}
    </div>
  );
}