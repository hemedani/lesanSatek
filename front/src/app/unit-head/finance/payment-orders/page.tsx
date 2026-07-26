import Link from "next/link"
import { Receipt } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Card as GlassCard } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { gets as getPaymentOrders } from "@/app/actions/paymentOrder/gets"

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
  const prevPageUrl = page > 1 ? `/unit-head/finance/payment-orders?page=${page - 1}&status=${status}` : ""
  const nextPageUrl = items.length >= limit ? `/unit-head/finance/payment-orders?page=${page + 1}&status=${status}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="دستورات پرداخت" description="مدیریت پرداخت‌های ارسال شده به واحد مالی" />

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={Receipt} title="دستور پرداختی یافت نشد" description="هیچ دستور پرداختی برای این واحد مالی ارسال نشده است." />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {items.map((item) => (
              <Link key={item._id} href={`/unit-head/finance/payment-orders/${item._id}`}>
                <GlassCard variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-inset ring-amber-400/15">
                          <Receipt className="size-5 text-amber-400" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium text-frost-link">
                            {item.title || "دستور پرداخت"}
                          </CardTitle>
                          {item.purchasingRequest?.title && (
                            <p className="text-xs text-fog/50 mt-0.5">{item.purchasingRequest.title}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[11px] px-2 py-0.5 font-medium ${statusColor[item.status || ""] || statusColor.draft}`}>
                        {statusLabel[item.status || ""] || item.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-xs text-fog">مبلغ</p>
                        <p className="text-moonlight font-medium mt-0.5" dir="ltr">
                          {item.amount?.toLocaleString("fa-IR") || "—"} ریال
                        </p>
                      </div>
                      {item.createdAt && (
                        <div className="text-end">
                          <p className="text-xs text-fog">تاریخ</p>
                          <p className="text-moonlight mt-0.5">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </GlassCard>
              </Link>
            ))}
          </div>
          <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
        </>
      )}
    </div>
  )
}
