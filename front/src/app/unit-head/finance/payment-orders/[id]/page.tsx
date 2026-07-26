import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, Receipt, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { get as getPaymentOrder } from "@/app/actions/paymentOrder/get"
import { MarkPaidButton } from "./mark-paid-button"

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

export default async function UnitHeadFinancePaymentOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const result = await getPaymentOrder(
    { _id: id },
    {
      _id: 1, title: 1, amount: 1, status: 1, description: 1, paidAt: 1, createdAt: 1,
      purchasingRequest: { _id: 1, title: 1 },
      issuedBy: { _id: 1, first_name: 1, last_name: 1 },
    },
  )

  if (!result.success || !result.body?.[0]) notFound()
  const po = result.body[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/unit-head/finance/payment-orders"
          className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
        >
          <ArrowRight className="size-4" />
          بازگشت به دستورات پرداخت
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-inset ring-amber-400/15">
                  <Receipt className="size-5 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-medium text-frost-link">
                    {po.title || "دستور پرداخت"}
                  </CardTitle>
                  <Badge variant="outline" className={`mt-1 text-[11px] px-2 py-0.5 font-medium ${statusColor[po.status || ""] || statusColor.draft}`}>
                    {statusLabel[po.status || ""] || po.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-fog">مبلغ</p>
                  <p className="text-moonlight font-medium mt-0.5 text-lg" dir="ltr">
                    {po.amount?.toLocaleString("fa-IR") || "—"} ریال
                  </p>
                </div>
                {po.createdAt && (
                  <div>
                    <p className="text-xs text-fog">تاریخ ایجاد</p>
                    <p className="text-moonlight mt-0.5">{new Date(po.createdAt).toLocaleDateString("fa-IR")}</p>
                  </div>
                )}
                {po.paidAt && (
                  <div>
                    <p className="text-xs text-fog">تاریخ پرداخت</p>
                    <p className="text-moonlight mt-0.5">{new Date(po.paidAt).toLocaleDateString("fa-IR")}</p>
                  </div>
                )}
              </div>
              {po.description && (
                <p className="text-sm text-fog/70 mt-4">{po.description}</p>
              )}
            </CardContent>
          </Card>

          {po.purchasingRequest && (
            <Link href={`/requests/${po.purchasingRequest._id}`}>
              <Card variant="glass" className="cursor-pointer hover:border-frost-link/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-electric-iris/10">
                      <ShoppingCart className="size-4 text-electric-iris" />
                    </div>
                    <CardTitle className="text-sm font-medium text-frost-link">
                      {po.purchasingRequest.title || "مشاهده درخواست خرید"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-fog/70">برای مشاهده جزئیات درخواست خرید کلیک کنید</p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-fog">اطلاعات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {po.issuedBy && (
                <div>
                  <p className="text-xs text-fog">ثبت‌کننده</p>
                  <p className="text-moonlight">
                    {po.issuedBy.first_name || ""} {po.issuedBy.last_name || ""}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-fog">مبلغ</p>
                <p className="text-moonlight font-medium" dir="ltr">
                  {po.amount?.toLocaleString("fa-IR") || "—"} ریال
                </p>
              </div>
            </CardContent>
          </Card>

          {po.status === "sent_to_finance" && (
            <MarkPaidButton paymentOrderId={po._id} amount={po.amount || 0} />
          )}
        </div>
      </div>
    </div>
  )
}
