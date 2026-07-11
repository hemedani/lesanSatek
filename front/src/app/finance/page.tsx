import Link from "next/link"
import { Calculator, Receipt, FileSpreadsheet, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { gets as getBudgetLines } from "@/app/actions/budgetLine/gets"
import { gets as getPaymentOrders } from "@/app/actions/paymentOrder/gets"

export default async function FinanceDashboard() {
  const [blRes, poRes] = await Promise.all([
    getBudgetLines({ page: 1, limit: 1 }, { _id: 1, totalAmount: 1, remainingAmount: 1 }).catch(() => ({ success: false, body: [] })),
    getPaymentOrders({ page: 1, limit: 1, filter: { status: "pending" } }, { _id: 1 }).catch(() => ({ success: false, body: [] })),
  ])

  const budgetLines = blRes.success ? blRes.body || [] : []
  const pendingPayments = poRes.success ? poRes.body || [] : []

  const totalBudget = budgetLines.reduce((sum: number, bl: { totalAmount?: number }) => sum + (bl.totalAmount || 0), 0)
  const remainingBudget = budgetLines.reduce((sum: number, bl: { remainingAmount?: number }) => sum + (bl.remainingAmount || 0), 0)

  const stats = [
    {
      label: "بودجه کل",
      value: `${totalBudget.toLocaleString("fa-IR")} تومان`,
      icon: Wallet,
      color: "text-electric-iris",
      bg: "bg-electric-iris/10",
    },
    {
      label: "بودجه باقی‌مانده",
      value: `${remainingBudget.toLocaleString("fa-IR")} تومان`,
      icon: Calculator,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "دستورات پرداخت در انتظار",
      value: pendingPayments.length,
      icon: Receipt,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "ردیف‌های بودجه",
      value: budgetLines.length,
      icon: FileSpreadsheet,
      color: "text-frost-link",
      bg: "bg-frost-link/10",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-glacier">پنل مالی</h1>
        <p className="text-sm text-fog mt-1">مدیریت بودجه و پرداخت‌ها</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg} ring-1 ring-inset ring-${stat.color.replace("text-", "")}/15`}>
                    <Icon className={`size-5 ${stat.color}`} />
                  </div>
                  <CardTitle className="text-sm font-medium text-fog leading-5">
                    {stat.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-glacier leading-8">{stat.value}</p>
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Link href="/finance/budget-lines">
          <Card variant="glass" className="cursor-pointer hover:border-frost-link/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                  <Calculator className="size-5 text-electric-iris" />
                </div>
                <CardTitle className="text-sm font-medium text-frost-link leading-5">
                  ردیف‌های بودجه
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-fog">مشاهده و مدیریت ردیف‌های بودجه</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance/payment-orders">
          <Card variant="glass" className="cursor-pointer hover:border-frost-link/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-inset ring-amber-400/15">
                  <Receipt className="size-5 text-amber-400" />
                </div>
                <CardTitle className="text-sm font-medium text-frost-link leading-5">
                  دستورات پرداخت
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-fog">مشاهده و مدیریت دستورات پرداخت</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance/budget-reports">
          <Card variant="glass" className="cursor-pointer hover:border-frost-link/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-frost-link/10 ring-1 ring-inset ring-frost-link/15">
                  <FileSpreadsheet className="size-5 text-frost-link" />
                </div>
                <CardTitle className="text-sm font-medium text-frost-link leading-5">
                  گزارش بودجه
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-fog">گزارش‌های تحلیلی بودجه</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
