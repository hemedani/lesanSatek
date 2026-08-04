import Link from "next/link"
import {
  Receipt,
  Coins,
  CheckCheck,
  ChevronLeft,
  ArrowLeft,
  RotateCcw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { gets as getPaymentOrders } from "@/app/actions/paymentOrder/gets"
import { PaymentOrdersFilter } from "./payment-orders-filter"

interface PaymentOrderItem {
  _id: string
  title?: string
  amount?: number
  status?: string
  description?: string
  createdAt?: string
  purchasingRequest?: { _id: string; title?: string }
}

const statusLabel: Record<string, string> = {
  draft: "پیش‌نویس",
  sent_to_finance: "ارسال به مالی",
  paid: "پرداخت شده",
  cancelled: "لغو شده",
}

const statusColor: Record<string, string> = {
  draft: "bg-white/5 text-fog/70 border-steel-border/40",
  sent_to_finance: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
}



export default async function UnitHeadFinancePaymentOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const status = resolvedSearchParams.status || "sent_to_finance"
  const limit = 20

  const result = await getPaymentOrders(
    { page, limit, status: status as "draft" | "sent_to_finance" | "paid" | "cancelled" },
    {
      _id: 1,
      title: 1,
      amount: 1,
      status: 1,
      description: 1,
      createdAt: 1,
      purchasingRequest: { _id: 1, title: 1 },
    },
  )
  const items: PaymentOrderItem[] = result.success ? result.body || [] : []

  const hasFilter = status && status !== "sent_to_finance"
  const totalAmount = items.reduce((s, i) => s + (i.amount ?? 0), 0)
  const paidCount = items.filter((i) => i.status === "paid").length

  const prevPageUrl = page > 1 ? `/unit-head/finance/payment-orders?page=${page - 1}${hasFilter ? `&status=${status}` : ""}` : ""
  const nextPageUrl = items.length >= limit ? `/unit-head/finance/payment-orders?page=${page + 1}${hasFilter ? `&status=${status}` : ""}` : ""

  return (
    <div className="space-y-6">
      <Link
        href="/unit-head/finance"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowLeft className="size-4" />
        بازگشت به امور مالی
      </Link>

      <PageHeader title="دستورات پرداخت" description="مدیریت پرداخت‌های ارسال شده به واحد مالی" />

      {/* 1. KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5">
        <StatCard label="دستورات پرداخت (این صفحه)" value={items.length} icon={Receipt} iconColor="text-amber-400" iconBg="bg-amber-400/10" subtitle={statusLabel[status] || status} />
        <StatCard label="مجموع مبلغ" value={`${totalAmount.toLocaleString("fa-IR")} ریال`} icon={Coins} iconColor="text-electric-iris" iconBg="bg-electric-iris/10" />
        <StatCard label="پرداخت شده" value={paidCount} icon={CheckCheck} iconColor="text-emerald-400" iconBg="bg-emerald-400/10" />
      </div>

      {/* 2. Filter bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <PaymentOrdersFilter value={status} defaultStatus="sent_to_finance" />
        {hasFilter && (
<Link
          href="/unit-head/finance/payment-orders"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-sm px-4 text-body-sm text-moonlight transition-all duration-200 outline-none select-none hover:text-glacier hover:bg-white/[0.04] hover:shadow-[inset_0_0_0_1px_rgba(186,215,247,0.12)] hover:shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <RotateCcw className="size-5" strokeWidth={2} />
          پاک کردن فیلترها
        </Link>
        )}
      </div>

      {/* 3. Rich cards */}
      {items.length === 0 ? (
        <div className="glass-card rounded-xl py-12">
          <EmptyState
            icon={Receipt}
            title="دستور پرداختی یافت نشد"
            description="هیچ دستور پرداختی برای این واحد مالی ارسال نشده است."
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {items.map((item) => (
              <Link
                key={item._id}
                href={`/unit-head/finance/payment-orders/${item._id}`}
                className="block outline-none"
              >
                <div className="glass-card glass-card-hover-active rounded-2xl p-5 transition-all duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-inset ring-amber-400/15">
                        <Receipt className="size-5 text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-frost-link leading-6">
                          {item.title || "دستور پرداخت"}
                        </p>
                        {item.purchasingRequest?.title && (
                          <p className="mt-0.5 truncate text-xs text-fog/50">{item.purchasingRequest.title}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[11px] px-2 py-0.5 font-medium shrink-0 ${statusColor[item.status || ""] || statusColor.draft}`}>
                      {statusLabel[item.status || ""] || item.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-steel-border/15 pt-3 text-sm">
                    <div>
                      <p className="text-xs text-fog">مبلغ</p>
                      <p className="mt-0.5 font-medium text-moonlight" dir="ltr">
                        {item.amount?.toLocaleString("fa-IR") || "—"} ریال
                      </p>
                    </div>
                    <div className="flex items-end gap-4">
                      {item.createdAt && (
                        <div className="text-end">
                          <p className="text-xs text-fog">تاریخ</p>
                          <p className="mt-0.5 text-moonlight">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</p>
                        </div>
                      )}
                      <ChevronLeft aria-hidden="true" strokeWidth={2} className="size-5 text-fog/40" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
        </>
      )}
    </div>
  )
}