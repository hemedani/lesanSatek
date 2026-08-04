"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Gavel, RotateCcw, ListFilter, CalendarDays, GitBranch, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

const STATUS_OPTIONS: FilterOption[] = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "open", label: "باز" },
  { value: "closed", label: "بسته شده" },
  { value: "awarded", label: "اعطا شده" },
  { value: "cancelled", label: "لغو شده" },
]

const TENDER_STATUS_MAP: Record<string, string> = {
  open: "باز",
  closed: "بسته شده",
  awarded: "اعطا شده",
  cancelled: "لغو شده",
}

interface TenderItem {
  _id: string
  title?: string
  deadline?: string
  status?: string
  description?: string
  purchasingRequest?: { _id: string; title?: string }
}

interface TenderCounts {
  total: number
  open: number
  awarded: number
  closed: number
}

interface TendersListClientProps {
  items: TenderItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
  totalPages?: number
  search: string
  status: string
  counts: TenderCounts
}

export function TendersListClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  totalPages,
  search,
  status,
  counts,
}: TendersListClientProps) {
  const router = useRouter()

  const makeParams = useCallback((next: { search?: string; status?: string }) => {
    const params = new URLSearchParams()
    const nextSearch = (next.search ?? search).trim()
    const nextStatus = next.status ?? status
    if (nextSearch) params.set("search", nextSearch)
    if (nextStatus) params.set("status", nextStatus)
    return params.toString()
  }, [search, status])

  const go = useCallback((qs: string) => {
    router.push(`/storehead/tenders${qs ? `?${qs}` : ""}`)
  }, [router])

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleStatus = (value: string | null) => go(makeParams({ status: value ?? "" }))
  const handleReset = () => router.push("/storehead/tenders")

  const hasFilters = Boolean(search || status)

  const statItems = [
    {
      key: "all",
      label: "کل مناقصات",
      value: counts.total,
      icon: Gavel,
      iconColor: "text-electric-iris",
      iconBg: "bg-electric-iris/10",
      status: "",
    },
    {
      key: "open",
      label: "مناقصات باز",
      value: counts.open,
      icon: Gavel,
      iconColor: "text-frost-link",
      iconBg: "bg-frost-link/10",
      status: "open",
    },
    {
      key: "awarded",
      label: "اعطا شده",
      value: counts.awarded,
      icon: Coins,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-400/10",
      status: "awarded",
    },
    {
      key: "closed",
      label: "بسته شده",
      value: counts.closed,
      icon: ListFilter,
      iconColor: "text-fog",
      iconBg: "bg-white/[0.03]",
      status: "closed",
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI / Stat Cards */}
      <section className="space-y-4" aria-label="وضعیت مناقصات">
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
          placeholder="جستجوی عنوان مناقصه..."
          ariaLabel="جستجو در مناقصات"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ListFilter}
            placeholder="همه وضعیت‌ها"
            ariaLabel="فیلتر وضعیت مناقصه"
            value={status}
            onValueChange={handleStatus}
            options={STATUS_OPTIONS}
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
              icon={Gavel}
              title="مناقصه‌ای یافت نشد"
              description={
                hasFilters
                  ? "هیچ مناقصه‌ای با فیلترهای انتخاب شده یافت نشد"
                  : "در حال حاضر هیچ مناقصه‌ای برای فروشگاه شما وجود ندارد"
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <Link
              key={item._id}
              href={`/storehead/tenders/${item._id}`}
              className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
                {/* Top Section */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-inset ring-violet-500/20">
                      <Gavel className="size-5 text-violet-400" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                        {item.title || "مناقصه"}
                      </p>
                      {item.purchasingRequest?.title && (
                        <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                          <GitBranch className="size-3.5" />
                          {item.purchasingRequest.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge
                    status={item.status || "open"}
                    label={TENDER_STATUS_MAP[item.status || "open"] || item.status || "باز"}
                  />
                </div>

                {/* Bottom Section */}
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
                  {item.deadline && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-fog/60" />
                      مهلت: {new Date(item.deadline).toLocaleDateString("fa-IR")}
                    </span>
                  )}
                  {item.status === "open" && (
                    <span className="ms-auto inline-flex items-center gap-1 text-xs text-frost-link">
                      قابل پیشنهاددهی
                    </span>
                  )}
                </div>
              </div>
            </Link>
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