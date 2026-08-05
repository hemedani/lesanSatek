import Link from "next/link"
import {
  FileEdit,
  Clock,
  ShoppingCart,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calculator,
  Receipt,
  TrendingDown,
  Landmark,
  Calendar,
  FileSpreadsheet,
  Warehouse,
  ScrollText,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { NavCard } from "@/components/dashboard/nav-card"
import { StatCard } from "@/components/dashboard/stat-card"
import { dashboardStatistic } from "@/app/actions/user/dashboardStatistic"
import { getPendingByUnit } from "@/app/actions/purchasingRequest/getPendingByUnit"
import { PendingApprovalsPreviewClient } from "./pending-approvals-preview"

export default async function UnitHeadDashboard() {
  const [statsRes, pendingRes] = await Promise.all([
    dashboardStatistic(
      { type: "unitHead" },
      {
        unit: 1,
        purchasingRequestCounts: 1,
        pendingApprovalCount: 1,
        receiptCount: 1,
        finance: 1,
        fiscalYear: 1,
        paymentOrders: 1,
      },
    ),
    getPendingByUnit(
      { page: 1, limit: 6 },
      {
        _id: 1,
        title: 1,
        quantity: 1,
        estimatedAmount: 1,
        status: 1,
        currentStep: 1,
        createdAt: 1,
        requester: { _id: 1, first_name: 1, last_name: 1 },
        wareModel: { _id: 1, name: 1 },
        process: {
          _id: 1,
          name: 1,
          steps: { _id: 1, name: 1, order: 1, stepType: 1 },
        },
      },
    ),
  ])

  const data = statsRes.success ? statsRes.body : null
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
  const pendingItems = pendingRes.success ? pendingRes.body || [] : []
  const finance = data?.finance
  const paymentOrders = data?.paymentOrders
  const fiscalYear = data?.fiscalYear

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title={unit ? `داشبورد ${unit.name}` : "داشبورد واحد"}
        description="خلاصه وضعیت درخواست‌های خرید و مدیریت کالا در واحد"
      >
        <Link href="/unit-head/requests">
          <Button size="sm" className="gap-1.5">
            <ShoppingCart className="size-5" />
            مدیریت درخواست‌ها
          </Button>
        </Link>
        <HelpLauncher topicId="unit-head-dashboard" tooltip="راهنمای داشبورد واحد" />
      </PageHeader>

      {/* KPI / Nav Cards */}
      <section className="space-y-4" aria-label="دسترسی سریع">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <NavCard
            href="/unit-head/requests/drafts"
            title="پیش‌نویس‌ها"
            description="درخواست‌های ثبت نشده واحد"
            value={draftCount}
            icon={FileEdit}
            iconColor="text-fog"
            iconBg="bg-white/[0.04]"
          />
          <NavCard
            href="/unit-head/requests/pending"
            title="نیازمند تایید"
            description="درخواست‌های ارجاع شده به واحد"
            value={pendingApprovalCount}
            icon={Clock}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
          />
          <NavCard
            href="/unit-head/requests"
            title="همه درخواست‌ها"
            description="لیست کامل درخواست‌های خرید"
            value={totalPRs}
            icon={ShoppingCart}
            iconColor="text-electric-iris"
            iconBg="bg-electric-iris/10"
          />
          {isWarehouseUnit ? (
            <NavCard
              href="/unit-head/goods-receipt"
              title="تحویل کالا"
              description="دریافت کالا در انبار"
              value={receiptCount}
              icon={Package}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-400/10"
            />
          ) : (
            <NavCard
              href="/unit-head/consumption"
              title="مصرف کالا"
              description="ثبت و مشاهده مصرف"
              icon={ScrollText}
              iconColor="text-amber-400"
              iconBg="bg-amber-400/10"
            />
          )}
        </div>
      </section>

      {/* Status Stats */}
      <section className="space-y-4" aria-label="وضعیت درخواست‌ها">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-frost-link" />
          <h2 className="text-sm font-medium text-fog tracking-wide">وضعیت درخواست‌های خرید</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="در انتظار بررسی"
            value={pendingPRs}
            icon={Clock}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            subtitle="در جریان تأیید"
          />
          <StatCard
            label="تایید شده"
            value={approvedPRs}
            icon={CheckCircle}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
            subtitle="تأیید نهایی شده"
          />
          <StatCard
            label="رد شده"
            value={rejectedPRs}
            icon={XCircle}
            iconColor="text-ember"
            iconBg="bg-ember/10"
            subtitle="ناموفق"
          />
          <StatCard
            label="همه درخواست‌ها"
            value={totalPRs}
            icon={AlertCircle}
            iconColor="text-electric-iris"
            iconBg="bg-electric-iris/10"
            subtitle="کل ثبت‌شده‌ها"
          />
        </div>
      </section>

      {/* Inventory Quick Access */}
      <section className="space-y-4" aria-label="مدیریت کالا">
        <div className="flex items-center gap-2">
          <Warehouse className="size-5 text-frost-link" />
          <h2 className="text-sm font-medium text-fog tracking-wide">مدیریت کالا</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          <NavCard
            href="/unit-head/inventory"
            title="موجودی انبار"
            description="مشاهده موجودی کالا"
            icon={Warehouse}
            iconColor="text-electric-iris"
            iconBg="bg-electric-iris/10"
          />
          <NavCard
            href="/unit-head/consumption"
            title="مصرف کالا"
            description="ثبت و مشاهده مصرف"
            icon={ScrollText}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
          />
          <NavCard
            href="/unit-head/stock-movements"
            title="گردش کالا"
            description="تاریخچه جابه‌جایی"
            icon={Activity}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
          />
        </div>
      </section>

      {/* Finance Summary */}
      {isFinanceUnit && finance && (
        <section className="space-y-4" aria-label="خلاصه بودجه">
          <div className="flex items-center gap-2">
            <Landmark className="size-5 text-frost-link" />
            <h2 className="text-sm font-medium text-fog tracking-wide">خلاصه بودجه</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Link href="/unit-head/finance/budget-lines">
              <Card variant="glass" className="cursor-pointer h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-frost-link/35 motion-reduce:hover:translate-y-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
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
              <Card variant="glass" className="cursor-pointer h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-frost-link/35 motion-reduce:hover:translate-y-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-inset ring-amber-400/15">
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
              <Card variant="glass" className="cursor-pointer h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-frost-link/35 motion-reduce:hover:translate-y-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-xl ring-1 ring-inset ${finance.totalRemaining > 0 ? "bg-emerald-400/10 ring-emerald-400/15" : "bg-ember/10 ring-ember/15"}`}>
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

          {/* Fiscal Year, Payment Orders & Reports */}
          {(fiscalYear || paymentOrders) && (
            <div className="grid gap-5 sm:grid-cols-3 mt-6">
              {fiscalYear?.active && (
                <Link href="/unit-head/finance/fiscal-years">
                  <Card variant="glass" className="cursor-pointer h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-frost-link/35 motion-reduce:hover:translate-y-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-inset ring-violet-500/15">
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
                <Card variant="glass" className="cursor-pointer h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-frost-link/35 motion-reduce:hover:translate-y-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-frost-link/10 ring-1 ring-inset ring-frost-link/15">
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
                  <Card variant="glass" className="cursor-pointer h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-frost-link/35 motion-reduce:hover:translate-y-0">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-inset ring-amber-400/15">
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
        </section>
      )}

      {/* Recent Pending Approvals */}
      <PendingApprovalsPreviewClient items={pendingItems} />

      {pendingApprovalCount > 0 && (
        <div className="flex justify-end">
          <Link href="/unit-head/requests/pending">
            <Button variant="outline" size="sm">مشاهده همه</Button>
          </Link>
        </div>
      )}
    </div>
  )
}