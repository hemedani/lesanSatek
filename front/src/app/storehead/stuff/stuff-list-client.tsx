"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Package, RotateCcw, AlertTriangle, Building2, Coins, CalendarDays, Barcode, Boxes } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

const EXPIRY_OPTIONS: FilterOption[] = [
  { value: "", label: "همه کالاها" },
  { value: "near", label: "فقط انقضای نزدیک" },
]

interface StuffItem {
  _id: string
  quantity?: number
  price?: number
  expiration?: string
  barcode?: number
  createdAt?: string
  ware?: { _id?: string; name?: string; brand?: string }
  store?: { _id?: string; name?: string }
}

interface StuffCounts {
  total: number
  nearExpiry: number
  totalUnits: number
}

interface StuffListClientProps {
  items: StuffItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
  totalPages?: number
  search: string
  expiry: string
  counts: StuffCounts
}

export function StuffListClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  totalPages,
  search,
  expiry,
  counts,
}: StuffListClientProps) {
  const router = useRouter()

  const makeParams = useCallback((next: { search?: string; expiry?: string }) => {
    const params = new URLSearchParams()
    const nextSearch = (next.search ?? search).trim()
    const nextExpiry = next.expiry ?? expiry
    if (nextSearch) params.set("search", nextSearch)
    if (nextExpiry) params.set("expiry", nextExpiry)
    return params.toString()
  }, [search, expiry])

  const go = useCallback((qs: string) => {
    router.push(`/storehead/stuff${qs ? `?${qs}` : ""}`)
  }, [router])

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleExpiry = (value: string | null) => go(makeParams({ expiry: value ?? "" }))
  const handleReset = () => router.push("/storehead/stuff")

  const hasFilters = Boolean(search || expiry)

  const statItems = [
    {
      key: "all",
      label: "کل کالاها",
      value: counts.total,
      icon: Boxes,
      iconColor: "text-electric-iris",
      iconBg: "bg-electric-iris/10",
      expiry: "",
    },
    {
      key: "units",
      label: "موجودی کل (عدد)",
      value: counts.totalUnits,
      icon: Package,
      iconColor: "text-frost-link",
      iconBg: "bg-frost-link/10",
      expiry: "",
    },
    {
      key: "near",
      label: "انقضای نزدیک",
      value: counts.nearExpiry,
      icon: AlertTriangle,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-400/10",
      expiry: "near",
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI / Stat Cards */}
      <section className="space-y-4" aria-label="وضعیت موجودی">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5">
          {statItems.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
              iconBg={stat.iconBg}
              active={expiry === stat.expiry}
              onClick={() => handleExpiry(stat.expiry)}
            />
          ))}
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی نام یا بارکد کالا..."
          ariaLabel="جستجو در کالاهای فروشگاه"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={AlertTriangle}
            placeholder="همه کالاها"
            ariaLabel="فیلتر انقضای کالا"
            value={expiry}
            onValueChange={handleExpiry}
            options={EXPIRY_OPTIONS}
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
              icon={Package}
              title="کالایی یافت نشد"
              description={
                hasFilters
                  ? "هیچ کالایی با فیلترهای انتخاب شده یافت نشد"
                  : "هنوز هیچ کالایی برای فروشگاه شما ثبت نشده است."
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {items.map((item) => (
            <Link
              key={item._id}
              href={`/storehead/stuff/${item._id}`}
              className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
                {/* Top Section */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20">
                      <Package className="size-5 text-electric-iris" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                        {item.ware?.name || "کالا"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        {item.ware?.brand && (
                          <span className="text-xs text-fog/70">{item.ware.brand}</span>
                        )}
                        {item.quantity != null && (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1 ring-inset",
                              item.quantity <= 5
                                ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
                            )}
                          >
                            {item.quantity.toLocaleString("fa-IR")} عدد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.quantity != null && item.quantity <= 5 && (
                    <AlertTriangle className="size-5 shrink-0 text-amber-400" />
                  )}
                </div>

                {/* Bottom Section */}
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
                  {item.store?.name && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-4 text-fog/60" />
                      {item.store.name}
                    </span>
                  )}
                  {item.price != null && (
                    <span className="inline-flex items-center gap-1.5 text-pebble">
                      <Coins className="size-4 text-fog/60" />
                      {item.price.toLocaleString("fa-IR")} ریال
                    </span>
                  )}
                  {item.expiration && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-fog/60" />
                      انقضا: {new Date(item.expiration).toLocaleDateString("fa-IR")}
                    </span>
                  )}
                  {item.barcode != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Barcode className="size-4 text-fog/60" />
                      {item.barcode.toLocaleString("fa-IR")}
                    </span>
                  )}
                  {item.createdAt && (
                    <span className="ms-auto inline-flex items-center gap-1.5">
                      {new Date(item.createdAt).toLocaleDateString("fa-IR")}
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