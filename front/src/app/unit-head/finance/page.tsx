import Link from "next/link"
import {
  ArrowRight,
  Calculator,
  Receipt,
  FileSpreadsheet,
  TrendingDown,
  Calendar,
  Landmark,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { NavCard } from "@/components/dashboard/nav-card"
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

  return (
    <div className="space-y-6">
      <Link
        href="/unit-head"
        className="inline-flex items-center gap-1.5 rounded-sm text-body-sm text-fog transition-colors hover:text-glacier focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>

      <PageHeader
        title="داشبورد مالی"
        description="خلاصه وضعیت بودجه و پرداخت‌ها در واحد شما"
      >
        <HelpLauncher topicId="unit-head-finance" tooltip="راهنمای داشبورد مالی" />
      </PageHeader>

      {/* 1. Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <StatCard
          label="بودجه کل"
          value={`${totalAllocated.toLocaleString("fa-IR")} ریال`}
          icon={Landmark}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
        />
        <StatCard
          label="مصرف شده"
          value={`${totalSpent.toLocaleString("fa-IR")} ریال`}
          icon={TrendingDown}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
        />
        <StatCard
          label="باقی‌مانده"
          value={`${totalRemaining.toLocaleString("fa-IR")} ریال`}
          icon={Calculator}
          iconColor={totalRemaining > 0 ? "text-emerald-400" : "text-ember"}
          iconBg={totalRemaining > 0 ? "bg-emerald-400/10" : "bg-ember/10"}
        />
        <StatCard
          label="پرداخت‌های در انتظار"
          value={paymentOrders?.sent_to_finance ?? 0}
          icon={Receipt}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
        />
      </div>

      {/* 2. Navigation cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        <NavCard
          href="/unit-head/finance/budget-lines"
          title="ردیف‌های بودجه"
          description="مشاهده و مدیریت ردیف‌های بودجه"
          icon={Calculator}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
          value={finance?.budgetLineCount ?? 0}
          footerLabel="رفتن به ردیف‌های بودجه"
        />
        <NavCard
          href="/unit-head/finance/payment-orders"
          title="دستورات پرداخت"
          description="پرداخت‌های ارسال شده به واحد مالی"
          icon={Receipt}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
          value={paymentOrders?.sent_to_finance ?? 0}
          footerLabel="رفتن به دستورات پرداخت"
        />
        <NavCard
          href="/unit-head/finance/budget-reports"
          title="گزارش بودجه"
          description="گزارش‌های تحلیلی بودجه"
          icon={FileSpreadsheet}
          iconColor="text-frost-link"
          iconBg="bg-frost-link/10"
          footerLabel="رفتن به گزارش بودجه"
        />
        {fiscalYear?.active ? (
          <NavCard
            href="/unit-head/finance/fiscal-years"
            title="سال مالی جاری"
            description={`${new Date(fiscalYear.active.startDate).toLocaleDateString("fa-IR")} — ${new Date(fiscalYear.active.endDate).toLocaleDateString("fa-IR")}`}
            icon={Calendar}
            iconColor="text-violet-400"
            iconBg="bg-violet-500/10"
            value={fiscalYear.count ?? 0}
            footerLabel={`${fiscalYear.active.name || "سال مالی"} — ${fiscalYear.count ?? 0} سال`}
          />
        ) : null}
      </div>

      {/* 3. Payment orders breakdown */}
      {paymentOrders && (
        <Card variant="glass">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-inset ring-amber-400/15">
                <Receipt className="size-4 text-amber-400" />
              </div>
              <CardTitle className="text-sm font-medium text-moonlight">وضعیت پرداخت‌ها</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              <div className="rounded-xl border border-steel-border/15 bg-[#05060f]/40 p-4">
                <p className="text-xl font-semibold text-fog tabular-nums" dir="ltr">{paymentOrders.draft.toLocaleString("fa-IR")}</p>
                <p className="text-xs text-fog/50 mt-1">پیش‌نویس</p>
              </div>
              <div className="rounded-xl border border-steel-border/15 bg-[#05060f]/40 p-4">
                <p className="text-xl font-semibold text-sky-400 tabular-nums" dir="ltr">{paymentOrders.sent_to_finance.toLocaleString("fa-IR")}</p>
                <p className="text-xs text-fog/50 mt-1">ارجاع شده</p>
              </div>
              <div className="rounded-xl border border-steel-border/15 bg-[#05060f]/40 p-4">
                <p className="text-xl font-semibold text-emerald-400 tabular-nums" dir="ltr">{paymentOrders.paid.toLocaleString("fa-IR")}</p>
                <p className="text-xs text-fog/50 mt-1">پرداخت شده</p>
              </div>
              <div className="rounded-xl border border-steel-border/15 bg-[#05060f]/40 p-4">
                <p className="text-xl font-semibold text-rose-400 tabular-nums" dir="ltr">{paymentOrders.cancelled.toLocaleString("fa-IR")}</p>
                <p className="text-xs text-fog/50 mt-1">لغو شده</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
