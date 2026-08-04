"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShoppingCart, RotateCcw, ListFilter, Truck, PackageCheck, CheckCircle2, User, Building2, GitBranch, Coins, Package, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { StatCard } from "@/components/dashboard/stat-card"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "پیش‌نویس", className: "bg-white/5 text-fog/70 border-steel-border/40" },
  sent_to_finance: { label: "ارجاع به مالی", className: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  paid: { label: "پرداخت شده", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "لغو شده", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
}

const STUFF_STATUS_OPTIONS: FilterOption[] = [
  { value: "", label: "همه وضعیت‌های کالا" },
  { value: "none", label: "بدون کالا" },
  { value: "assigned", label: "تخصیص داده شده" },
  { value: "ready_to_ship", label: "آماده ارسال" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل شده" },
  { value: "received", label: "دریافت شده" },
  { value: "cancelled", label: "لغو شده" },
]

const GOODS_RECEIPT_OPTIONS: FilterOption[] = [
  { value: "", label: "همه وضعیت‌های رسید" },
  { value: "none", label: "بدون رسید - تحویل نشده" },
  { value: "pending", label: "در انتظار تأیید رسید" },
  { value: "completed", label: "رسید تکمیل شده" },
  { value: "partially_rejected", label: "رد شده جزئی" },
]

const PAYMENT_ORDER_STATUS_OPTIONS: FilterOption[] = [
  { value: "", label: "همه وضعیت‌های پرداخت" },
  { value: "none", label: "بدون پرداخت" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "sent_to_finance", label: "ارجاع به مالی" },
  { value: "paid", label: "پرداخت شده" },
  { value: "cancelled", label: "لغو شده" },
]

const SORT_OPTIONS: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "completedAt-desc", label: "تاریخ تکمیل" },
  { value: "amount-desc", label: "مبلغ" },
  { value: "title-desc", label: "عنوان" },
  { value: "updatedAt-desc", label: "آخرین بروزرسانی" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
]

const STUFF_STATUS_LABELS: Record<string, string> = {
  assigned: "تخصیص داده شده",
  ready_to_ship: "آماده ارسال",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  received: "دریافت شده",
  cancelled: "لغو شده",
}

interface PRItem {
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
  paymentOrders?: { _id: string; status?: string; amount?: number }[]
}

interface PRCounts {
  total: number
  needsDelivery: number
  pendingReceipt: number
  completedReceipt: number
}

interface PRListClientProps {
  items: PRItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
  totalPages: number
  search: string
  stuffStatusFilter: string
  goodsReceiptStatusFilter: string
  paymentOrderStatusFilter: string
  sortBy: string
  sortOrder: string
  counts: PRCounts
}

export function PRListClient({
  items,
  prevPageUrl,
  nextPageUrl,
  page,
  totalPages,
  search,
  stuffStatusFilter,
  goodsReceiptStatusFilter,
  paymentOrderStatusFilter,
  sortBy,
  sortOrder,
  counts,
}: PRListClientProps) {
  const router = useRouter()

  const buildUrl = useCallback((overrides: Record<string, string>) => {
    const params = new URLSearchParams()
    const s = overrides.search ?? search
    const ss = overrides.stuffStatus ?? stuffStatusFilter
    const grs = overrides.goodsReceiptStatus ?? goodsReceiptStatusFilter
    const pos = overrides.paymentOrderStatus ?? paymentOrderStatusFilter
    const sb = overrides.sortBy ?? sortBy
    const so = overrides.sortOrder ?? sortOrder
    if (s) params.set("search", s)
    if (ss) params.set("stuffStatus", ss)
    if (grs) params.set("goodsReceiptStatus", grs)
    if (pos) params.set("paymentOrderStatus", pos)
    if (sb) params.set("sortBy", sb)
    if (so) params.set("sortOrder", so)
    if (overrides.page && overrides.page !== "1") params.set("page", overrides.page)
    const qs = params.toString()
    return `/storehead/purchasing-requests${qs ? `?${qs}` : ""}`
  }, [search, stuffStatusFilter, goodsReceiptStatusFilter, paymentOrderStatusFilter, sortBy, sortOrder])

  const handleSearch = useCallback((value: string) => {
    router.push(buildUrl({ search: value, page: "" }))
  }, [router, buildUrl])

  const handleStuffStatusChange = useCallback((value: string | null) => {
    router.push(buildUrl({ stuffStatus: value || "", page: "" }))
  }, [router, buildUrl])

  const handleGoodsReceiptStatusChange = useCallback((value: string | null) => {
    router.push(buildUrl({ goodsReceiptStatus: value || "", page: "" }))
  }, [router, buildUrl])

  const handlePaymentOrderStatusChange = useCallback((value: string | null) => {
    router.push(buildUrl({ paymentOrderStatus: value || "", page: "" }))
  }, [router, buildUrl])

  const handleSortChange = useCallback((value: string | null) => {
    const [field, order] = (value || "").split("-")
    router.push(buildUrl({ sortBy: field, sortOrder: order || "desc", page: "" }))
  }, [router, buildUrl])

  const handleReset = useCallback(() => {
    router.push("/storehead/purchasing-requests")
  }, [router])

  const hasFilters = Boolean(search || stuffStatusFilter || goodsReceiptStatusFilter || paymentOrderStatusFilter || sortBy)

  const sortValue = sortBy ? `${sortBy}-${sortOrder || "desc"}` : ""

  const statItems = [
    {
      key: "total",
      label: "کل درخواست‌ها",
      value: counts.total,
      icon: ShoppingCart,
      iconColor: "text-electric-iris",
      iconBg: "bg-electric-iris/10",
      goodsReceiptStatus: "",
    },
    {
      key: "needsDelivery",
      label: "نیازمند تحویل",
      value: counts.needsDelivery,
      icon: Truck,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-400/10",
      goodsReceiptStatus: "none",
    },
    {
      key: "pendingReceipt",
      label: "در انتظار تأیید رسید",
      value: counts.pendingReceipt,
      icon: PackageCheck,
      iconColor: "text-sky-400",
      iconBg: "bg-sky-400/10",
      goodsReceiptStatus: "pending",
    },
    {
      key: "completedReceipt",
      label: "رسید تکمیل شده",
      value: counts.completedReceipt,
      icon: CheckCircle2,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-400/10",
      goodsReceiptStatus: "completed",
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI / Stat Cards */}
      <section className="space-y-4" aria-label="وضعیت تحویل درخواست‌ها">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
          {statItems.map((stat) => (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.iconColor}
              iconBg={stat.iconBg}
              active={goodsReceiptStatusFilter === stat.goodsReceiptStatus}
              onClick={() => handleGoodsReceiptStatusChange(stat.goodsReceiptStatus)}
            />
          ))}
        </div>
      </section>

      {/* Filter Bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی عنوان درخواست..."
          ariaLabel="جستجو در درخواست‌های خرید"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={Package}
            placeholder="همه وضعیت‌های کالا"
            ariaLabel="فیلتر وضعیت کالا"
            value={stuffStatusFilter}
            onValueChange={handleStuffStatusChange}
            options={STUFF_STATUS_OPTIONS}
          />
          <FilterSelect
            icon={Truck}
            placeholder="همه وضعیت‌های رسید"
            ariaLabel="فیلتر رسید کالا"
            value={goodsReceiptStatusFilter}
            onValueChange={handleGoodsReceiptStatusChange}
            options={GOODS_RECEIPT_OPTIONS}
          />
          <FilterSelect
            icon={ListFilter}
            placeholder="همه وضعیت‌های پرداخت"
            ariaLabel="فیلتر وضعیت پرداخت"
            value={paymentOrderStatusFilter}
            onValueChange={handlePaymentOrderStatusChange}
            options={PAYMENT_ORDER_STATUS_OPTIONS}
          />
          <FilterSelect
            icon={CalendarDays}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش درخواست‌ها"
            value={sortValue}
            onValueChange={handleSortChange}
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
              icon={ShoppingCart}
              title={goodsReceiptStatusFilter === "none" ? "همه درخواست‌ها تحویل داده شده‌اند" : "درخواستی یافت نشد"}
              description={
                hasFilters
                  ? "هیچ درخواست خریدی با فیلترهای انتخاب شده یافت نشد"
                  : "هیچ درخواست خریدی به فروشگاه شما تخصیص داده نشده است."
              }
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
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
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                            {STUFF_STATUS_LABELS[item.stuffStatus] || item.stuffStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <RequestStatusBadge status={item.status} />
                </div>

                {/* Bottom Section */}
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
                  {item.store?.name && (
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-4 text-fog/60" />
                      {item.store.name}
                    </span>
                  )}
                  {item.requestingUnit?.name && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="size-4 text-fog/60" />
                      {item.requestingUnit.name}
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
                  {item.paymentOrders && item.paymentOrders.length > 0 && (
                    <div className="flex w-full flex-wrap items-center gap-1.5">
                      {Object.entries(
                        item.paymentOrders.reduce<Record<string, number>>((acc, po) => {
                          const s = po.status || "draft"
                          acc[s] = (acc[s] || 0) + 1
                          return acc
                        }, {})
                      ).map(([status, count]) => {
                        const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.draft
                        return (
                          <span key={status} className={cn("inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium", config.className)}>
                            {config.label}{count > 1 ? ` (${count.toLocaleString("fa-IR")})` : ""}
                          </span>
                        )
                      })}
                    </div>
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

      <Pagination
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        className="pt-2 border-t border-steel-border/15"
      />
    </div>
  )
}