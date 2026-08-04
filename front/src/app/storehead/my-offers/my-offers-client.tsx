"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { FileText, RotateCcw, ListFilter, ArrowDownUp, Coins, Clock, CalendarDays, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

const OFFER_STATUS_MAP: Record<string, string> = {
  submitted: "در انتظار بررسی",
  accepted: "پذیرفته شده",
  rejected: "رد شده",
  awarded: "برنده",
}

const STATUS_OPTIONS: FilterOption[] = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "submitted", label: "در انتظار بررسی" },
  { value: "accepted", label: "پذیرفته شده" },
  { value: "rejected", label: "رد شده" },
  { value: "awarded", label: "برنده" },
]

const SORT_OPTIONS: FilterOption[] = [
  { value: "desc", label: "جدیدترین" },
  { value: "asc", label: "قدیمی‌ترین" },
]

interface OfferItem {
  _id: string
  price?: number
  status?: string
  deliveryTime?: number
  submittedAt?: string
  createdAt?: string
  tender?: { _id: string; title?: string }
  ware?: { _id?: string; name?: string; brand?: string }
}

interface OfferCounts {
  total: number
  submitted: number
  accepted: number
  awarded: number
}

interface MyOffersClientProps {
  items: OfferItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
  totalPages?: number
  search: string
  status: string
  sort: "asc" | "desc"
  counts: OfferCounts
}

export function MyOffersClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  totalPages,
  search,
  status,
  sort,
  counts,
}: MyOffersClientProps) {
  const router = useRouter()

  const makeParams = useCallback((next: { search?: string; status?: string; sort?: string }) => {
    const params = new URLSearchParams()
    const nextSearch = (next.search ?? search).trim()
    const nextStatus = next.status ?? status
    const nextSort = next.sort ?? sort
    if (nextSearch) params.set("search", nextSearch)
    if (nextStatus) params.set("status", nextStatus)
    if (nextSort === "asc") params.set("sort", "asc")
    return params.toString()
  }, [search, status, sort])

  const go = useCallback((qs: string) => {
    router.push(`/storehead/my-offers${qs ? `?${qs}` : ""}`)
  }, [router])

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleStatus = (value: string | null) => go(makeParams({ status: value ?? "" }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value === "asc" ? "asc" : "desc" }))
  const handleReset = () => router.push("/storehead/my-offers")

  const hasFilters = Boolean(search || status || sort === "asc")

  const statItems = [
    {
      key: "all",
      label: "کل پیشنهادها",
      value: counts.total,
      icon: FileText,
      iconColor: "text-electric-iris",
      iconBg: "bg-electric-iris/10",
      status: "",
    },
    {
      key: "submitted",
      label: "در انتظار بررسی",
      value: counts.submitted,
      icon: Clock,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-400/10",
      status: "submitted",
    },
    {
      key: "accepted",
      label: "پذیرفته شده",
      value: counts.accepted,
      icon: Coins,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-400/10",
      status: "accepted",
    },
    {
      key: "awarded",
      label: "برنده",
      value: counts.awarded,
      icon: FileText,
      iconColor: "text-frost-link",
      iconBg: "bg-frost-link/10",
      status: "awarded",
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI / Stat Cards */}
      <section className="space-y-4" aria-label="وضعیت پیشنهادها">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {statItems.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
              iconBg={stat.iconBg}
              active={status === stat.status}
              onClick={() => handleStatus(stat.status)}
            />
          ))}
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی پیشنهاد..."
          ariaLabel="جستجو در پیشنهادهای من"
          className="w-full lg:min-w-64 lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ListFilter}
            placeholder="همه وضعیت‌ها"
            ariaLabel="فیلتر وضعیت پیشنهاد"
            value={status}
            onValueChange={handleStatus}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش پیشنهادها"
            value={sort}
            onValueChange={handleSort}
            options={SORT_OPTIONS}
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

      {/* Items */}
      {items.length === 0 ? (
        <div className="glass-card rounded-2xl">
          <div className="p-12">
            <EmptyState
              icon={FileText}
              title="پیشنهادی یافت نشد"
              description={
                hasFilters
                  ? "هیچ پیشنهادی با فیلترهای انتخاب شده یافت نشد"
                  : "شما هنوز هیچ پیشنهادی ثبت نکرده‌اید"
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <div key={item._id} className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
              {/* Top Section */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20">
                    <FileText className="size-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <p className="truncate text-base font-semibold text-moonlight">
                      {item.tender?.title || "پیشنهاد"}
                    </p>
                    {item.ware?.name && (
                      <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                        <Package className="size-3.5" />
                        {item.ware.name}
                        {item.ware.brand ? ` (${item.ware.brand})` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge
                  status={item.status || "submitted"}
                  label={OFFER_STATUS_MAP[item.status || "submitted"] || item.status || "در انتظار بررسی"}
                />
              </div>

              {/* Bottom Section */}
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
                {item.price != null && (
                  <span className="inline-flex items-center gap-1.5 text-pebble">
                    <Coins className="size-4 text-fog/60" />
                    {item.price.toLocaleString("fa-IR")} ریال
                  </span>
                )}
                {item.deliveryTime != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-fog/60" />
                    تحویل: {item.deliveryTime.toLocaleString("fa-IR")} روز
                  </span>
                )}
                {(item.submittedAt || item.createdAt) && (
                  <span className="ms-auto inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-fog/60" />
                    {new Date(item.submittedAt || item.createdAt || "").toLocaleDateString("fa-IR")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(prevPageUrl || nextPageUrl) && (
        <Pagination
          prevUrl={prevPageUrl}
          nextUrl={nextPageUrl}
          page={page}
          totalPages={totalPages}
          className="pt-2 border-t border-steel-border/15"
        />
      )}
    </div>
  )
}