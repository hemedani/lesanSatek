"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Clock,
  ListFilter,
  ArrowDownUp,
  RotateCcw,
  User,
  Boxes,
  Package,
  Coins,
  CalendarDays,
  GitBranch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

export interface PendingPRItem {
  _id: string
  title?: string
  quantity?: number
  estimatedAmount?: number
  status?: string
  currentStep?: number
  createdAt?: string
  requester?: { _id?: string; first_name?: string; last_name?: string }
  wareModel?: { _id?: string; name?: string }
  process?: {
    _id?: string
    name?: string
    steps?: {
      _id?: string
      name?: string
      order?: number
      stepType?: string
    }[]
  }
}

const sortOptions: FilterOption[] = [
  { value: "desc", label: "جدیدترین" },
  { value: "asc", label: "قدیمی‌ترین" },
]

function currentStepName(item: PendingPRItem): string | undefined {
  const idx = item.currentStep ?? 0
  const step = item.process?.steps?.find((s) => s.order === idx) || item.process?.steps?.[idx]
  return step?.name
}

function PendingApprovalsPreviewClient({
  items,
}: {
  items: PendingPRItem[]
}) {
  const [search, setSearch] = useState("")
  const [processId, setProcessId] = useState("")
  const [sort, setSort] = useState<"asc" | "desc">("desc")

  const processOptions: FilterOption[] = useMemo(() => {
    const seen = new Set<string>()
    return items
      .map((item) => item.process)
      .filter((p): p is { _id?: string; name?: string } => Boolean(p?._id))
      .filter((p) => {
        if (!p._id || seen.has(p._id)) return false
        seen.add(p._id)
        return true
      })
      .map((p) => ({ value: p._id as string, label: p.name || "بدون نام" }))
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const result = items.filter((item) => {
      if (processId && item.process?._id && item.process._id !== processId) return false
      if (!q) return true
      const title = (item.title || "").toLowerCase()
      const requesterName = [item.requester?.first_name, item.requester?.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      const wareName = (item.wareModel?.name || "").toLowerCase()
      return title.includes(q) || requesterName.includes(q) || wareName.includes(q)
    })
    return result.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return sort === "asc" ? ta - tb : tb - ta
    })
  }, [items, search, processId, sort])

  const hasActiveFilters = Boolean(search.trim() || processId)

  const handleReset = () => {
    setSearch("")
    setProcessId("")
  }

  return (
    <section className="space-y-5" aria-label="آخرین درخواست‌های نیازمند تایید">
      <div className="flex items-center gap-2">
        <Clock className="size-5 text-frost-link" />
        <h2 className="text-sm font-medium text-fog tracking-wide">آخرین درخواست‌های نیازمند تایید</h2>
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="جستجو در درخواست‌های نیازمند تایید…"
          ariaLabel="جستجو در درخواست‌های نیازمند تایید"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          {processOptions.length > 0 && (
            <FilterSelect
              icon={GitBranch}
              placeholder="همه فرآیندها"
              ariaLabel="فیلتر فرآیند درخواست"
              value={processId}
              onValueChange={(value) => setProcessId(value ?? "")}
              options={processOptions}
            />
          )}
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش درخواست‌ها"
            value={sort}
            onValueChange={(value) => setSort(value === "asc" ? "asc" : "desc")}
            options={sortOptions}
          />
          {hasActiveFilters && (
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

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {filtered.map((item) => (
            <PendingApprovalCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Clock}
          title="درخواستی برای تایید یافت نشد"
          description={
            hasActiveFilters
              ? "با تغییر فیلترها یا پاک کردن جستجو، درخواست موردنظر را پیدا کنید."
              : "همه درخواست‌های خرید واحد شما بررسی شده‌اند."
          }
          action={
            hasActiveFilters ? (
              <Button variant="ghost" onClick={handleReset} className="gap-2 px-4">
                <ListFilter className="size-5" />
                پاک کردن فیلترها
              </Button>
            ) : undefined
          }
        />
      )}
    </section>
  )
}

function PendingApprovalCard({ item }: { item: PendingPRItem }) {
  const requesterName = item.requester
    ? [item.requester.first_name, item.requester.last_name].filter(Boolean).join(" ")
    : ""
  const stepName = currentStepName(item)

  return (
    <Link
      href={`/unit-head/requests/${item._id}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-inset ring-amber-400/20">
              <Clock className="size-5 text-amber-400" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                {item.title || "درخواست خرید"}
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {item.process?.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                    <GitBranch className="size-3.5" />
                    {item.process.name}
                  </span>
                )}
                {stepName && (
                  <span className="inline-flex items-center rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-pebble ring-1 ring-inset ring-steel-border/25">
                    {stepName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <RequestStatusBadge status={item.status} />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
          {requesterName && (
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4 text-fog/60" />
              {requesterName}
            </span>
          )}
          {item.wareModel?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Boxes className="size-4 text-fog/60" />
              {item.wareModel.name}
            </span>
          )}
          {item.quantity != null && (
            <span className="inline-flex items-center gap-1.5">
              <Package className="size-4 text-fog/60" />
              {item.quantity.toLocaleString("fa-IR")} عدد
            </span>
          )}
          {item.estimatedAmount != null && (
            <span className="inline-flex items-center gap-1.5 text-pebble">
              <Coins className="size-4 text-fog/60" />
              {item.estimatedAmount.toLocaleString("fa-IR")} ریال
            </span>
          )}
          {item.createdAt && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                requesterName && "ms-auto",
              )}
            >
              <CalendarDays className="size-4 text-fog/60" />
              {new Date(item.createdAt).toLocaleDateString("fa-IR")}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export { PendingApprovalsPreviewClient }