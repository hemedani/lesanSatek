"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShoppingCart, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { Pagination } from "@/components/ui/pagination"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: "پیش‌نویس", className: "bg-white/5 text-fog/70 border-steel-border/40" },
  sent_to_finance: { label: "ارجاع به مالی", className: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  paid: { label: "پرداخت شده", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  cancelled: { label: "لغو شده", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
}

const STUFF_STATUS_OPTIONS = [
  { value: "", label: "همه وضعیت‌های کالا" },
  { value: "none", label: "بدون کالا" },
  { value: "assigned", label: "تخصیص داده شده" },
  { value: "ready_to_ship", label: "آماده ارسال" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل شده" },
  { value: "received", label: "دریافت شده" },
  { value: "cancelled", label: "لغو شده" },
]

const GOODS_RECEIPT_OPTIONS = [
  { value: "", label: "همه" },
  { value: "none", label: "بدون رسید — تحویل نشده" },
  { value: "pending", label: "در انتظار تأیید رسید" },
  { value: "completed", label: "رسید تکمیل شده" },
  { value: "partially_rejected", label: "رد شده جزئی" },
]

const PAYMENT_ORDER_STATUS_OPTIONS = [
  { value: "", label: "همه" },
  { value: "none", label: "بدون پرداخت" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "sent_to_finance", label: "ارجاع به مالی" },
  { value: "paid", label: "پرداخت شده" },
  { value: "cancelled", label: "لغو شده" },
]

const SORT_OPTIONS = [
  { value: "createdAt", label: "جدیدترین" },
  { value: "completedAt", label: "تاریخ تکمیل" },
  { value: "amount", label: "مبلغ" },
  { value: "title", label: "عنوان" },
  { value: "updatedAt", label: "آخرین بروزرسانی" },
]

interface PRItem {
  _id: string
  title?: string
  status?: string
  quantity?: number
  estimatedAmount?: number
  stuffStatus?: string
  createdAt?: string
  paymentOrders?: { _id: string; status?: string; amount?: number }[]
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

  const hasFilters = search || stuffStatusFilter || goodsReceiptStatusFilter || paymentOrderStatusFilter || sortBy

  const sortValue = sortBy ? `${sortBy}-${sortOrder || "desc"}` : ""

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی عنوان درخواست..."
          className="w-full sm:w-64"
        />
        <Select value={stuffStatusFilter} onValueChange={handleStuffStatusChange}>
          <SelectTrigger className="min-w-56 h-9 text-sm">
            <SelectValue placeholder="وضعیت کالا" />
          </SelectTrigger>
          <SelectContent>
            {STUFF_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={goodsReceiptStatusFilter} onValueChange={handleGoodsReceiptStatusChange}>
          <SelectTrigger className="min-w-64 h-9 text-sm">
            <SelectValue placeholder="رسید کالا" />
          </SelectTrigger>
          <SelectContent>
            {GOODS_RECEIPT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentOrderStatusFilter} onValueChange={handlePaymentOrderStatusChange}>
          <SelectTrigger className="min-w-52 h-9 text-sm">
            <SelectValue placeholder="وضعیت پرداخت" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_ORDER_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortValue} onValueChange={handleSortChange}>
          <SelectTrigger className="min-w-44 h-9 text-sm">
            <SelectValue placeholder="مرتب‌سازی" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
            <RotateCcw className="size-3.5" />
            پاک کردن
          </Button>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState
              icon={ShoppingCart}
              title={goodsReceiptStatusFilter === "none" ? "همه درخواست‌ها تحویل داده شده‌اند" : "درخواستی یافت نشد"}
              description={
                hasFilters
                  ? "هیچ درخواست خریدی با فیلترهای انتخاب شده یافت نشد"
                  : "هیچ درخواست خریدی به فروشگاه شما تخصیص داده نشده است."
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Card variant="glass">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
              {items.map((item) => (
                <Link key={item._id} href={`/storehead/purchasing-requests/${item._id}`}>
                  <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 cursor-pointer h-full">
                    <div className="flex items-start gap-3">
                      <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0 mt-0.5">
                        <ShoppingCart className="size-5 text-electric-iris" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-moonlight leading-6 truncate">
                          {item.title || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <RequestStatusBadge status={item.status} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-fog/50">
                      {item.quantity != null && (
                        <span>{item.quantity.toLocaleString("fa-IR")} عدد</span>
                      )}
                      {item.estimatedAmount != null && (
                        <span>{item.estimatedAmount.toLocaleString("fa-IR")} ریال</span>
                      )}
                      {item.stuffStatus && item.stuffStatus !== "none" && (
                        <span className="text-fog/70">
                          {STUFF_STATUS_OPTIONS.find((o) => o.value === item.stuffStatus)?.label || item.stuffStatus}
                        </span>
                      )}
                      {item.paymentOrders && item.paymentOrders.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 w-full">
                          {Object.entries(
                            item.paymentOrders.reduce<Record<string, number>>((acc, po) => {
                              const s = po.status || "draft"
                              acc[s] = (acc[s] || 0) + 1
                              return acc
                            }, {})
                          ).map(([status, count]) => {
                            const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.draft
                            return (
                              <Badge key={status} variant="outline" className={cn("text-[10px] px-1.5 py-0 font-medium", config.className)}>
                                {config.label}{count > 1 ? ` (${count})` : ""}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                      {item.createdAt && (
                        <span className="ms-auto">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Pagination
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}
