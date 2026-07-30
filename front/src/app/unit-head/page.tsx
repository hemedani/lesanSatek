import Link from "next/link"
import { FileEdit, Clock, ShoppingCart, Package, CheckCircle, XCircle, AlertCircle, Calculator, Receipt, TrendingDown, Landmark, Calendar, FileSpreadsheet, Warehouse, ScrollText, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dashboardStatistic } from "@/app/actions/user/dashboardStatistic"

export default async function UnitHeadDashboard() {
  const res = await dashboardStatistic(
    { type: "unitHead" },
    {
      unit: 1,
      purchasingRequestCounts: 1,
      pendingApprovalCount: 1,
      recentApprovals: 1,
      receiptCount: 1,
      finance: 1,
      fiscalYear: 1,
      paymentOrders: 1,
    },
  )

  const data = res.success ? res.body : null
  const unit = data?.unit
  const prCounts = data?.purchasingRequestCounts
  const isFinanceUnit = unit?.type === "Finance"
  const isWarehouseUnit = unit?.type === "Warehouse"

  const draftCount = prCounts?.draft ?? 0
  const pendingApprovalCount = data?.pendingApprovalCount ?? 0
  const totalPRs = prCounts?.total ?? 0
  const pendingPRs = prCounts?.pending ?? 0
  const approvedPRs = prCounts?.approved ?? 0
  const rejectedPRs = prCounts?.rejected ?? 0
  const receiptCount = data?.receiptCount ?? 0
  const recentApprovals = data?.recentApprovals ?? []
  const finance = data?.finance
  const paymentOrders = data?.paymentOrders
  const fiscalYear = data?.fiscalYear

  const navCards = [
    {
      title: "پیش‌نویس‌ها",
      description: "درخواست‌های ثبت نشده واحد",
      value: draftCount,
      icon: FileEdit,
      color: "text-fog",
      bg: "bg-white/[0.03]",
      href: "/unit-head/requests/drafts",
    },
    {
      title: "نیازمند تایید",
      description: "درخواست‌های ارجاع شده به واحد",
      value: pendingApprovalCount,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      href: "/unit-head/requests/pending",
    },
    ...(isWarehouseUnit ? [{
      title: "تحویل کالا",
      description: "دریافت کالا در انبار",
      value: receiptCount,
      icon: Package,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      href: "/unit-head/goods-receipt",
    }] : []),

    {
      title: "همه درخواست‌ها",
      description: "لیست کامل درخواست‌های خرید",
      value: totalPRs,
      icon: ShoppingCart,
      color: "text-electric-iris",
      bg: "bg-electric-iris/10",
      href: "/unit-head/requests",
    },
  ]

  const inventoryNavCards = [
    {
      title: "موجودی انبار",
      description: "مشاهده موجودی کالا",
      icon: Warehouse,
      color: "text-electric-iris",
      bg: "bg-electric-iris/10",
      href: "/unit-head/inventory",
    },
    {
      title: "مصرف کالا",
      description: "ثبت و مشاهده مصرف",
      icon: ScrollText,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      href: "/unit-head/consumption",
    },
    {
      title: "گردش کالا",
      description: "تاریخچه جابه‌جایی",
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      href: "/unit-head/stock-movements",
    },
  ]

  const stats = [
    { label: "در انتظار بررسی", value: pendingPRs, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "تایید شده", value: approvedPRs, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "رد شده", value: rejectedPRs, icon: XCircle, color: "text-ember", bg: "bg-ember/10" },
    { label: "فعال", value: totalPRs, icon: AlertCircle, color: "text-electric-iris", bg: "bg-electric-iris/10" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-glacier">داشبورد {unit?.name || "واحد"}</h1>
        <p className="text-sm text-fog mt-1">خلاصه وضعیت درخواست‌های خرید واحد</p>
      </div>

      {/* Nav Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {navCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${card.bg} ring-1 ring-inset ring-white/[0.06]`}>
                      <Icon className={`size-5 ${card.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium text-frost-link leading-5">
                        {card.title}
                      </CardTitle>
                      <p className="text-xs text-fog/50 mt-0.5">{card.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-glacier leading-8">{card.value}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Inventory Nav Cards */}
      <div>
        <h2 className="text-sm font-medium text-fog tracking-wide mb-4">مدیریت کالا</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {inventoryNavCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.href} href={card.href}>
                <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-lg ${card.bg} ring-1 ring-inset ring-white/[0.06]`}>
                        <Icon className={`size-5 ${card.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium text-frost-link leading-5">
                          {card.title}
                        </CardTitle>
                        <p className="text-xs text-fog/50 mt-0.5">{card.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-2" />
                    <p className="text-xs text-fog/40">مشاهده جزئیات</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Status Stats */}
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

      {/* Finance Summary */}
      {isFinanceUnit && finance && (
        <div>
          <h2 className="text-sm font-medium text-fog tracking-wide mb-4">خلاصه بودجه</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/unit-head/finance/budget-lines">
              <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                      <Landmark className="size-5 text-electric-iris" />
                    </div>
                    <CardTitle className="text-sm font-medium text-fog">بودجه کل</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-glacier leading-8" dir="ltr">{finance.totalAllocated.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-fog/50 mt-1">ریال</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/unit-head/finance/budget-lines">
              <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-inset ring-amber-400/15">
                      <TrendingDown className="size-5 text-amber-400" />
                    </div>
                    <CardTitle className="text-sm font-medium text-fog">مصرف شده</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-glacier leading-8" dir="ltr">{finance.totalSpent.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-fog/50 mt-1">ریال</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/unit-head/finance/budget-lines">
              <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-lg ring-1 ring-inset ${finance.totalRemaining > 0 ? "bg-emerald-400/10 ring-emerald-400/15" : "bg-ember/10 ring-ember/15"}`}>
                      <Calculator className={`size-5 ${finance.totalRemaining > 0 ? "text-emerald-400" : "text-ember"}`} />
                    </div>
                    <CardTitle className="text-sm font-medium text-fog">باقی‌مانده</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-semibold leading-8 ${finance.totalRemaining > 0 ? "text-emerald-400" : "text-ember"}`} dir="ltr">{finance.totalRemaining.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-fog/50 mt-1">ریال</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Fiscal Year & Payment Orders & Reports */}
          {(fiscalYear || paymentOrders) && (
            <div className="grid gap-6 sm:grid-cols-3 mt-6">
              {fiscalYear?.active && (
                <Link href="/unit-head/finance/fiscal-years">
                  <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-inset ring-violet-500/15">
                          <Calendar className="size-5 text-violet-400" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium text-frost-link">سال مالی جاری</CardTitle>
                          <p className="text-xs text-fog/50 mt-0.5">{fiscalYear.count} سال مالی</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-base font-medium text-glacier">{fiscalYear.active.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-fog/50">
                          {new Date(fiscalYear.active.startDate).toLocaleDateString("fa-IR")} — {new Date(fiscalYear.active.endDate).toLocaleDateString("fa-IR")}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">فعال</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
              <Link href="/unit-head/finance/budget-reports">
                <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30 h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-frost-link/10 ring-1 ring-inset ring-frost-link/15">
                        <FileSpreadsheet className="size-5 text-frost-link" />
                      </div>
                      <CardTitle className="text-sm font-medium text-frost-link">گزارش بودجه</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-fog">گزارش‌های تحلیلی بودجه</p>
                    <p className="text-xs text-fog/50 mt-1">مشاهده جزئیات</p>
                  </CardContent>
                </Card>
              </Link>
              {paymentOrders && (
                <Link href="/unit-head/finance/payment-orders">
                  <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-inset ring-amber-400/15">
                          <Receipt className="size-5 text-amber-400" />
                        </div>
                        <CardTitle className="text-sm font-medium text-frost-link">وضعیت پرداخت‌ها</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-lg font-semibold text-fog">{paymentOrders.draft}</p>
                          <p className="text-[10px] text-fog/50">پیش‌نویس</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-sky-400">{paymentOrders.sent_to_finance}</p>
                          <p className="text-[10px] text-fog/50">ارجاع شده</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-emerald-400">{paymentOrders.paid}</p>
                          <p className="text-[10px] text-fog/50">پرداخت شده</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-rose-400">{paymentOrders.cancelled}</p>
                          <p className="text-[10px] text-fog/50">لغو شده</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Pending Approvals */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <p className="text-sm font-medium text-fog tracking-wide">فعالیت اخیر</p>
          <CardTitle className="text-base font-medium text-frost-link mt-1">
            آخرین درخواست‌های نیازمند تایید
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentApprovals.length > 0 ? (
            <ul className="space-y-2">
              {recentApprovals.map((a: { _id: string; status?: string; createdAt?: string }) => (
                <li key={a._id} className="flex items-center gap-2 text-sm text-fog py-1">
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  {a.status === "pending" ? "در انتظار تایید" : a.status}
                  {a.createdAt && (
                    <span className="text-xs text-fog/50 ms-auto">
                      {new Date(a.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fog py-2">هیچ درخواست در انتظار تاییدی وجود ندارد</p>
          )}
          {pendingApprovalCount > 0 && (
            <div className="mt-4">
              <Link href="/unit-head/requests/pending">
                <Button variant="outline" size="sm">مشاهده همه</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
