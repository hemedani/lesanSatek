import Link from "next/link"
import { Calculator, Receipt, FileSpreadsheet, Wallet, TrendingDown, Calendar, Landmark } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { dashboardStatistic } from "@/app/actions/user/dashboardStatistic"

export default async function UnitHeadFinanceDashboard() {
  const res = await dashboardStatistic(
    { type: "unitHead" },
    {
      unit: 1,
      finance: 1,
      fiscalYear: 1,
      paymentOrders: 1,
    },
  )

  const data = res.success ? res.body : null
  const finance = data?.finance
  const fiscalYear = data?.fiscalYear
  const paymentOrders = data?.paymentOrders

  const totalAllocated = finance?.totalAllocated ?? 0
  const totalSpent = finance?.totalSpent ?? 0
  const totalRemaining = finance?.totalRemaining ?? 0

  const stats = [
    {
      label: "بودجه کل",
      value: `${totalAllocated.toLocaleString("fa-IR")} ریال`,
      icon: Landmark,
      color: "text-electric-iris",
      bg: "bg-electric-iris/10",
    },
    {
      label: "مصرف شده",
      value: `${totalSpent.toLocaleString("fa-IR")} ریال`,
      icon: TrendingDown,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "باقی‌مانده",
      value: `${totalRemaining.toLocaleString("fa-IR")} ریال`,
      icon: Calculator,
      color: totalRemaining > 0 ? "text-emerald-400" : "text-ember",
      bg: "bg-emerald-400/10",
    },
    {
      label: "پرداخت‌های در انتظار",
      value: paymentOrders?.sent_to_finance ?? 0,
      icon: Receipt,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-glacier">داشبورد مالی</h1>
        <p className="text-sm text-fog mt-1">خلاصه وضعیت بودجه و پرداخت‌ها</p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg} ring-1 ring-inset ring-white/[0.06]`}>
                    <Icon className={`size-5 ${stat.color}`} />
                  </div>
                  <CardTitle className="text-sm font-medium text-fog leading-5">{stat.label}</CardTitle>
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

      {/* Budget lines and payment orders cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {fiscalYear?.active && (
          <Link href="/unit-head/finance/fiscal-years">
            <Card variant="glass" className="cursor-pointer hover:border-frost-link/30 transition-colors h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-inset ring-violet-500/15">
                    <Calendar className="size-5 text-violet-400" />
                  </div>
                  <CardTitle className="text-sm font-medium text-frost-link leading-5">سال مالی جاری</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-glacier">{fiscalYear.active.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-fog/50">
                    {new Date(fiscalYear.active.startDate).toLocaleDateString("fa-IR")} — {new Date(fiscalYear.active.endDate).toLocaleDateString("fa-IR")}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">فعال</Badge>
                </div>
                <p className="text-xs text-fog/50 mt-2">{fiscalYear.count} سال مالی</p>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/unit-head/finance/budget-lines">
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
              <p className="text-xs text-fog/50 mt-1">{finance?.budgetLineCount ?? 0} ردیف</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/unit-head/finance/payment-orders">
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
              <p className="text-sm text-fog">پرداخت‌های ارسال شده به واحد مالی</p>
              <p className="text-xs text-fog/50 mt-1">{paymentOrders?.sent_to_finance ?? 0} در انتظار</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/unit-head/finance/budget-reports">
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

      {/* Payment orders breakdown */}
      {paymentOrders && (
        <Card variant="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-frost-link">وضعیت پرداخت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl font-semibold text-fog">{paymentOrders.draft}</p>
                <p className="text-xs text-fog/50 mt-1">پیش‌نویس</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-sky-400">{paymentOrders.sent_to_finance}</p>
                <p className="text-xs text-fog/50 mt-1">ارجاع شده</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-emerald-400">{paymentOrders.paid}</p>
                <p className="text-xs text-fog/50 mt-1">پرداخت شده</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-rose-400">{paymentOrders.cancelled}</p>
                <p className="text-xs text-fog/50 mt-1">لغو شده</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
