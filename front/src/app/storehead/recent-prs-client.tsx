"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShoppingCart, RotateCcw, ListFilter, Truck, CheckCircle2, User, Building2, GitBranch, Coins, Package, CalendarDays, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS: FilterOption[] = [
  { value: "", label: "همه وضعیت‌های رسید" },
  { value: "pending", label: "در انتظار تأیید رسید" },
  { value: "none", label: "نیازمند تحویل" },
  { value: "completed", label: "رسید تکمیل شده" },
]

const STUFF_STATUS_LABELS: Record<string, string> = {
  assigned: "تخصیص داده شده",
  ready_to_ship: "آماده ارسال",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  received: "دریافت شده",
  cancelled: "لغو شده",
}

interface RecentPRItem {
  _id: string
  title?: string
  status?: string
  quantity?: number
  estimatedAmount?: number
  stuffStatus?: string
  createdAt?: string
  process?: { _id?: string; name?: string }
  requestingUnit?: { _id?: string; name?: string }
  store?: { _id?: string; name?: string }
}

interface RecentPRsClientProps {
  items: RecentPRItem[]
  search: string
  status: string
}

export function RecentPRsClient({ items, search, status }: RecentPRsClientProps) {
  const router = useRouter()

  const makeParams = useCallback((next: { search?: string; status?: string }) => {
    const params = new URLSearchParams()
    const nextSearch = (next.search ?? search).trim()
    const nextStatus = next.status ?? status
    if (nextSearch) params.set("prSearch", nextSearch)
    if (nextStatus) params.set("prStatus", nextStatus)
    return params.toString()
  }, [search, status])

  const go = useCallback((qs: string) => {
    router.push(`/storehead${qs ? `?${qs}` : ""}`)
  }, [router])

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleStatus = (value: string | null) => go(makeParams({ status: value ?? "" }))
  const handleReset = () => {
    const params = new URLSearchParams()
    params.set("prStatus", "pending")
    router.push(`/storehead?${params.toString()}`)
  }

  const hasFilters = Boolean(search || status)

  return (
    <section className="space-y-5" aria-label="آخرین درخواست‌های نیازمند تایید">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 border-b border-steel-border/20 pb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-frost-link" />
          <h2 className="text-sm font-medium text-fog tracking-wide">آخرین درخواست‌های نیازمند تایید</h2>
        </div>
        <Link href="/storehead/purchasing-requests" className="group inline-flex items-center gap-1.5 text-body-sm text-frost-link outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 rounded-sm">
          مشاهده همه
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی عنوان درخواست..."
          ariaLabel="جستجو در درخواست‌های نیازمند تایید"
          className="w-full lg:min-w-56 lg:max-w-sm lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ListFilter}
            placeholder="همه وضعیت‌های رسید"
            ariaLabel="فیلتر وضعیت رسید"
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
          <div className="p-10">
            <EmptyState
              icon={ShoppingCart}
              title="درخواستی یافت نشد"
              description={
                hasFilters
                  ? "هیچ درخواستی با فیلترهای انتخاب شده یافت نشد"
                  : "در حال حاضر درخواستی نیازمند تأیید شما نیست."
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {items.map((item) => (
            <Link
              key={item._id}
              href={`/storehead/purchasing-requests/${item._id}`}
              className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
                {/* Top Section */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20">
                      <ShoppingCart className="size-5 text-electric-iris" />
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
                        {item.stuffStatus && item.stuffStatus !== "none" && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
                              item.stuffStatus === "delivered" || item.stuffStatus === "received"
                                ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 ring-amber-500/20",
                            )}
                          >
                            {item.stuffStatus === "delivered" || item.stuffStatus === "received"
                              ? <CheckCircle2 className="size-3" />
                              : <Truck className="size-3" />}
                            {STUFF_STATUS_LABELS[item.stuffStatus || ""] || item.stuffStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <RequestStatusBadge status={item.status} />
                </div>

                {/* Bottom Section */}
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
                  {item.requestingUnit?.name && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="size-4 text-fog/60" />
                      {item.requestingUnit.name}
                    </span>
                  )}
                  {item.store?.name && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-4 text-fog/60" />
                      {item.store.name}
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
                    <span className="ms-auto inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-fog/60" />
                      {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}