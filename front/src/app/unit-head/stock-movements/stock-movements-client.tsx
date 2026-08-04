"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowDownUp,
  User,
  Building2,
  Store,
  MessageSquareText,
  CalendarDays,
  FolderTree,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterSelect } from "@/components/ui/filter-select";
import type { FilterOption } from "@/components/ui/filter-select";

export type StockMovementReason =
  | "goods_receipt"
  | "goods_issue"
  | "transfer_in"
  | "transfer_out"
  | "consumption"
  | "adjustment"
  | "return"
  | "write_off"

export interface StockMovement {
  _id: string
  quantity?: number
  balanceBefore?: number
  balanceAfter?: number
  reason?: StockMovementReason
  description?: string
  createdAt?: string
  unit?: { _id: string; name?: string; type?: string }
  createdBy?: { _id: string; first_name?: string; last_name?: string }
  store?: { _id: string; name?: string }
  ware?: { _id: string; name?: string; enName?: string; brand?: string }
  wareModel?: { _id: string; name?: string; enName?: string }
  wareGroup?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
}

export interface StockMovementCounts {
  total: number
  incoming: number
  outgoing: number
}

interface StockMovementsClientProps {
  items: StockMovement[]
  counts: StockMovementCounts
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
}

const reasonStyle: Record<string, string> = {
  goods_receipt: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  goods_issue: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  transfer_in: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  transfer_out: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  consumption: "bg-red-500/10 text-red-400 border-red-500/20",
  adjustment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  return: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  write_off: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

const reasonOptions: FilterOption[] = Object.keys(reasonLabels).map((value) => ({
  value,
  label: reasonLabels[value],
}))

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "quantity-desc", label: "بیشترین تغییر" },
  { value: "quantity-asc", label: "کمترین تغییر" },
]

type SortKey = "createdAt-desc" | "createdAt-asc" | "quantity-desc" | "quantity-asc";

function isSortKey(value: string): value is SortKey {
  return sortOptions.some((o) => o.value === value);
}

function faDate(iso?: string, withTime = false): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

function StockMovementCard({ item }: { item: StockMovement }) {
  const isIn = (item.quantity || 0) > 0
  const isOut = (item.quantity || 0) < 0
  const wareName = item.ware?.name || item.wareModel?.name || "کالای بدون نام"
  const createdByName = item.createdBy
    ? [item.createdBy.first_name, item.createdBy.last_name].filter(Boolean).join(" ")
    : ""
  const hierarchyChips = [item.wareType?.name, item.wareClass?.name, item.wareGroup?.name].filter(Boolean) as string[]
  const hasBalance = item.balanceBefore != null && item.balanceAfter != null

  return (
    <Link
      href={`/unit-head/stock-movements/${item._id}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
        {/* Top section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                isIn ? "bg-emerald-500/10 ring-emerald-500/20" : isOut ? "bg-ember/10 ring-ember/15" : "bg-white/[0.04] ring-white/[0.06]",
              )}
            >
              {isIn ? (
                <ArrowDownToLine className="size-5 text-emerald-400" />
              ) : isOut ? (
                <ArrowUpFromLine className="size-5 text-ember" />
              ) : (
                <Activity className="size-5 text-fog" />
              )}
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                  {wareName}
                </p>
                {item.reason && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                      reasonStyle[item.reason] || "bg-white/[0.04] text-fog border-white/[0.06]",
                    )}
                  >
                    {reasonLabels[item.reason] || item.reason}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {item.wareModel?.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">{item.wareModel.name}</span>
                )}
                {item.ware?.brand && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">{item.ware.brand}</span>
                )}
              </div>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 text-2xl font-bold tabular-nums leading-8",
              isIn ? "text-emerald-400" : isOut ? "text-ember" : "text-fog",
            )}
            dir="ltr"
          >
            {isOut ? "−" : "+"}{Math.abs(item.quantity ?? 0).toLocaleString("fa-IR")}
          </span>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">تغییر</p>
            <p
              className={cn(
                "mt-1 text-lg font-bold tabular-nums leading-7",
                isIn ? "text-emerald-400" : isOut ? "text-ember" : "text-fog",
              )}
              dir="ltr"
            >
              {isOut ? "−" : "+"}{Math.abs(item.quantity ?? 0).toLocaleString("fa-IR")}
            </p>
          </div>
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">واحد</p>
            <p className="mt-1 truncate text-sm font-medium text-moonlight leading-7">{item.unit?.name || "—"}</p>
          </div>
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">تاریخ</p>
            <p className="mt-1 text-sm font-medium text-moonlight leading-7">{faDate(item.createdAt)}</p>
          </div>
        </div>

        {/* Bottom metadata section */}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
          {createdByName && (
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4 text-fog/60" />
              {createdByName}
            </span>
          )}
          {item.store?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Store className="size-4 text-fog/60" />
              {item.store.name}
            </span>
          )}
          {item.description && (
            <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
              <MessageSquareText className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{item.description}</span>
            </span>
          )}
        </div>

        {/* Hierarchy + balance */}
        {(hierarchyChips.length > 0 || hasBalance) && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-steel-border/15 pt-3">
            {hierarchyChips.length > 0 && (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <FolderTree className="size-4 text-fog/60" />
                {hierarchyChips.map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="rounded-full bg-frost-link/5 px-2.5 py-0.5 text-[11px] font-medium text-fog border-steel-border/30"
                  >
                    {name}
                  </Badge>
                ))}
              </span>
            )}
            {hasBalance && (
              <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70" dir="ltr">
                <Building2 className="size-4 shrink-0 text-fog/60" />
                موجودی: {item.balanceBefore?.toLocaleString("fa-IR")} ← {item.balanceAfter?.toLocaleString("fa-IR")}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export function StockMovementsClient({ items, counts }: StockMovementsClientProps) {
  const [reason, setReason] = useState("");
  const [sort, setSort] = useState<SortKey>("createdAt-desc");

  const filtered = useMemo(() => {
    const list = items.filter((i) => (!reason || i.reason === reason));
    const sortAsc = sort.endsWith("-asc");
    let sorted = list;
    if (sort.startsWith("createdAt")) {
      sorted = [...list].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    } else {
      sorted = [...list].sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0));
    }
    return sortAsc ? sorted : sorted.reverse();
  }, [items, reason, sort]);

  const hasFilters = Boolean(reason || sort !== "createdAt-desc");

  const handleReset = () => {
    setReason("");
    setSort("createdAt-desc");
  };

  return (
    <div className="space-y-6">
      {/* 1. KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
        <StatCard
          label="کل گردش‌ها"
          value={counts.total}
          icon={Activity}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
        />
        <StatCard
          label="ورود"
          value={counts.incoming}
          icon={ArrowDownToLine}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />
        <StatCard
          label="خروج"
          value={counts.outgoing}
          icon={ArrowUpFromLine}
          iconColor="text-ember"
          iconBg="bg-ember/10"
        />
      </div>

      {/* 2. Filter bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="نوع گردش"
            ariaLabel="فیلتر نوع گردش"
            value={reason}
            onValueChange={(v) => setReason(v ?? "")}
            options={reasonOptions}
          />
          <FilterSelect
            icon={CalendarDays}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش گردش‌ها"
            value={sort}
            onValueChange={(v) => setSort(isSortKey(v || "") ? v as SortKey : "createdAt-desc")}
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

      {/* 3. Rich cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {filtered.map((item) => (
            <StockMovementCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-steel-border/15 bg-graphite-plate/40 backdrop-blur-md">
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
              <Activity className="size-6 text-fog/30" />
            </div>
            <p className="text-sm font-medium text-fog/50">
              {hasFilters ? "گردشی یافت نشد" : "هنوز گردش کالی ثبت نشده است"}
            </p>
            <p className="text-xs text-fog/30 mt-1">
              {hasFilters
                ? "با تغییر نوع گردش یا مرتب‌سازی، حرکت موردنظر را پیدا کنید."
                : "پس از رسید، خروج یا انتقال کالا، گردش‌ها در این صفحه ثبت می‌شوند."}
            </p>
            {hasFilters && (
              <Button variant="ghost" className="mt-4 gap-2 px-4" onClick={handleReset}>
                <RotateCcw className="size-4" />
                پاک کردن فیلترها
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
