"use client"

import { useMemo, useState } from "react"
import { Wallet, TrendingDown, Calculator, Percent, RotateCcw, Search } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { SearchField } from "@/components/ui/search-field"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"

interface BudgetLineItem {
  _id: string
  code?: string
  title?: string
  description?: string
  totalAllocated?: number
  totalEncumbered?: number
  totalSpent?: number
  remainingBudget?: number
}

interface BudgetReportListProps {
  items: BudgetLineItem[]
}

function remainingColor(remaining?: number, allocated?: number) {
  if (!remaining || !allocated) return "text-fog"
  const ratio = remaining / allocated
  if (ratio <= 0.1) return "text-ember"
  if (ratio <= 0.3) return "text-amber-400"
  return "text-emerald-400"
}

function remainingBg(remaining?: number, allocated?: number) {
  if (!remaining || !allocated) return "bg-fog/10 text-fog"
  const ratio = remaining / allocated
  if (ratio <= 0.1) return "bg-ember/10 text-ember"
  if (ratio <= 0.3) return "bg-amber-400/10 text-amber-400"
  return "bg-emerald-400/10 text-emerald-400"
}

function BudgetReportList({ items }: BudgetReportListProps) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim()
    if (!q) return items
    return items.filter((i) =>
      [i.title, i.code, i.description, i.title]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase())
    )
  }, [items, search])

  const hasFilter = Boolean(search.trim())

  return (
    <div className="space-y-6">
      {/* 1. KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        <StatCard label="بودجه کل" value={items.reduce((s, i) => s + (i.totalAllocated || 0), 0)} icon={Wallet} iconColor="text-electric-iris" iconBg="bg-electric-iris/10" />
        <StatCard label="مصرف شده" value={items.reduce((s, i) => s + (i.totalSpent || 0), 0)} icon={TrendingDown} iconColor="text-amber-400" iconBg="bg-amber-400/10" />
        <StatCard label="باقی‌مانده" value={items.reduce((s, i) => s + (i.remainingBudget || 0), 0)} icon={Calculator} iconColor="text-emerald-400" iconBg="bg-emerald-400/10" />
        <StatCard
          label="نرخ مصرف"
          value={`${(() => {
            const total = items.reduce((s, i) => s + (i.totalAllocated || 0), 0)
            return total > 0 ? ((items.reduce((s, i) => s + (i.totalSpent || 0), 0) / total) * 100).toFixed(1) : 0
          })()}٪`}
          icon={Search}
          iconColor="text-frost-link"
          iconBg="bg-frost-link/10"
        />
      </div>

      {/* 2. Filter bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="جستجو در عنوان، کد و شرح…"
          ariaLabel="جستجو در ردیف‌های بودجه"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        {hasFilter && (
          <Button
            variant="ghost"
            onClick={() => setSearch("")}
            className="h-11 gap-2 rounded-sm px-4 text-body-sm text-moonlight"
          >
            <RotateCcw className="size-5" strokeWidth={2} />
            پاک کردن فیلترها
          </Button>
        )}
      </div>

      {/* 3. Rich cards */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl py-12">
          <EmptyState
          icon={Percent}
            title={hasFilter ? "ردیف بودجه‌ای یافت نشد" : "هیچ ردیف بودجه‌ای ثبت نشده است"}
            description={hasFilter ? "با تغییر جستجو، ردیف موردنظر را پیدا کنید." : "ردیف‌های بودجه پس از ایجاد در این گزارش نمایش داده می‌شوند."}
            action={hasFilter ? <Button variant="ghost" className="gap-2 px-4" onClick={() => setSearch("")}>پاک کردن فیلترها</Button> : undefined}
          />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((item) => {
            const consumption = item.totalAllocated && item.totalAllocated > 0
              ? (item.totalSpent || 0) / item.totalAllocated
              : 0
            const pct = Math.round(Math.min(1, consumption) * 100)
            return (
              <div key={item._id} className="glass-card glass-card-hover-active rounded-2xl p-5 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/[0.08]">
                      <Calculator className="size-5 text-frost-link" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-moonlight leading-6">
                        {item.title || "—"}
                        {item.code && <span className="ms-2 text-xs font-normal text-fog/50" dir="ltr">{item.code}</span>}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-fog/50 leading-5">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${remainingColor(item.remainingBudget, item.totalAllocated)}`} dir="ltr">
                    {item.remainingBudget?.toLocaleString("fa-IR") || "—"} ریال
                  </span>
                </div>
                <div className="mt-4 border-t border-steel-border/15 pt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-fog/60">نرخ مصرف</span>
                    <span className="text-fog/80 tabular-nums" dir="ltr">{pct}٪</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                    <div
                      className={`h-full rounded-full transition-all ${remainingBg(item.remainingBudget, item.totalAllocated)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-fog/60">
                    <span className="flex flex-col gap-0.5">
                      تخصیص
                      <span className="text-moonlight tabular-nums" dir="ltr">{item.totalAllocated?.toLocaleString("fa-IR") || "—"}</span>
                    </span>
                    <span className="flex flex-col gap-0.5">
                      مصرف
                      <span className="text-moonlight tabular-nums" dir="ltr">{item.totalSpent?.toLocaleString("fa-IR") || "—"}</span>
                    </span>
                    <span className="flex flex-col gap-0.5">
                      تعهد شده
                      <span className="text-moonlight tabular-nums" dir="ltr">{item.totalEncumbered?.toLocaleString("fa-IR") || "—"}</span>
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { BudgetReportList }