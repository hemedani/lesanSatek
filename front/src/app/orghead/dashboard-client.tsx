"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Clock,
  ShoppingCart,
  Warehouse,
  ScrollText,
  Activity,
  AlertTriangle,
  BarChart3,
  Timer,
  Landmark,
  Users,
  GitBranch,
  Network,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { NavCard } from "@/components/dashboard/nav-card";
import { PrStatusDonut } from "@/components/orghead/charts/pr-status-donut";
import { PrMonthlyBar } from "@/components/orghead/charts/pr-monthly-bar";
import { SelectionBreakdownPie } from "@/components/orghead/charts/selection-breakdown-pie";
import { BudgetBurnKpi } from "@/components/orghead/charts/budget-burn-kpi";
import { BudgetLineBreakdown } from "@/components/orghead/charts/budget-line-breakdown";
import { InventorySummaryBar } from "@/components/orghead/charts/inventory-summary-bar";
import { InventoryLowStock } from "@/components/orghead/charts/inventory-low-stock";
import { ConsumptionTrendArea } from "@/components/orghead/charts/consumption-trend-area";
import { ConsumptionByUnitBar } from "@/components/orghead/charts/consumption-by-unit-bar";
import { ConsumptionByCategoryPie } from "@/components/orghead/charts/consumption-by-category-pie";
import { ProcurementByStoreBar } from "@/components/orghead/charts/procurement-by-store-bar";
import { StockMovementChart } from "@/components/orghead/charts/stock-movement-chart";
import { StepBottleneckBar } from "@/components/orghead/charts/step-bottleneck-bar";
import { formatCurrency } from "@/components/orghead/charts/colors";

interface OrgBanner {
  _id: string;
  name: string;
}

interface OrgHeadStats {
  unit?: { _id: string; name: string; type: string };
  purchasingRequestCounts?: {
    draft: number; pending: number; approved: number;
    rejected: number; total: number;
  };
  pendingApprovalCount?: number;
  recentApprovals?: Array<{ _id: string; status: string; createdAt: string }>;
  finance?: {
    budgetLineCount: number; totalAllocated: number;
    totalSpent: number; totalRemaining: number;
    pendingPaymentCount: number;
  };
  receiptCount?: number;
  fiscalYear?: {
    count: number;
    active: {
      _id: string; name: string; startDate: string;
      endDate: string; isActive: boolean;
    } | null;
  };
  paymentOrders?: {
    draft: number; sent_to_finance: number;
    paid: number; cancelled: number;
  };
  prStatusDistribution?: {
    draft: number; pending: number; inProgress: number;
    approved: number; pendingFinalization: number;
    rejected: number; completed: number; cancelled: number;
  };
  prMonthlyTrend?: Array<{
    year: number; month: number;
    count: number; totalEstimatedAmount: number;
  }>;
  prCycleTime?: {
    averageDays: number; minDays: number;
    maxDays: number; totalCompleted: number;
  };
  budgetLineBreakdown?: Array<{
    _id: string; code: string; title: string;
    totalAllocated: number; totalEncumbered?: number;
    totalSpent?: number; remainingBudget: number;
  }>;
  budgetBurnDown?: {
    totalAllocated: number; totalEncumbered: number;
    totalSpent: number; totalRemaining: number;
  };
  inventorySummary?: {
    totalItems: number; totalQuantity: number;
    byWareType: Array<{
      _id: string; name: string; enName?: string;
      count: number; totalQuantity: number;
    }>;
  };
  inventoryLowStock?: {
    count: number;
    items: Array<{
      _id: string; quantity: number; minQuantity: number;
      ware: { _id: string; name: string };
      unit: { _id: string; name: string };
      wareModel: { _id: string; name: string };
    }>;
  };
  consumptionTrend?: Array<{
    year: number; month: number;
    totalQuantity: number; count: number;
  }>;
  consumptionByUnit?: Array<{
    _id: string; unitName: string;
    totalQuantity: number; count: number;
  }>;
  consumptionByCategory?: Array<{
    _id: string; name: string; enName?: string;
    totalQuantity: number; count: number;
  }>;
  procurementByStore?: Array<{
    _id: string; storeName: string;
    totalPRs: number; totalEstimatedAmount: number;
  }>;
  selectionBreakdown?: {
    stuff: number; tender: number; none: number;
  };
  stockMovementSummary?: {
    totalIn: number; totalOut: number;
    byReason: Array<{
      _id: string;
      totalQuantity: number;
      count: number;
    }>;
  };
  stepBottleneck?: Array<{
    stepName: string; stepType: string;
    avgHours: number; minHours: number;
    maxHours: number; count: number;
  }>;
}

interface Props {
  organization: OrgBanner | null;
  stats: OrgHeadStats | null;
}

export function OrgHeadDashboardClient({ organization, stats }: Props) {
  const router = useRouter();
  const prCounts = stats?.purchasingRequestCounts;
  const pendingFinalization = stats?.prStatusDistribution?.pendingFinalization ?? 0;
  const cycleTime = stats?.prCycleTime;
  const budgetBurn = stats?.budgetBurnDown;
  const lowStockCount = stats?.inventoryLowStock?.count ?? 0;
  const totalPRs = prCounts?.total ?? 0;

  const budgetUtilizationPct = budgetBurn && budgetBurn.totalAllocated > 0
    ? Math.round((budgetBurn.totalSpent / budgetBurn.totalAllocated) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="داشبورد سازمان"
        description={organization ? `نمای کلی عملکرد سازمان «${organization.name}»` : "نمای کلی عملکرد سازمان"}
      >
        {totalPRs > 0 && (
          <Badge variant="outline" className="gap-1.5 border-electric-iris/25 bg-electric-iris/5 text-frost-link">
            <ShoppingCart className="size-5" />
            {totalPRs.toLocaleString("fa-IR")} درخواست خرید
          </Badge>
        )}
        <Link href="/orghead/requests">
          <Button size="sm" className="gap-1.5">
            <ShoppingCart className="size-5" />
            مدیریت درخواست‌ها
          </Button>
        </Link>
      </PageHeader>

      {/* Section 1: Org Banner */}
      {organization && (
        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-electric-iris/[0.03] to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                <Building2 className="size-6 text-electric-iris" />
              </div>
              <div>
                <p className="text-sm text-fog/60">سازمان شما</p>
                <p className="text-lg font-semibold text-glacier">{organization.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 2: KPI Row */}
      <div className="grid gap-5 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="کل درخواست‌ها"
          value={totalPRs}
          icon={ShoppingCart}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
          subtitle="مشاهده همه درخواست‌ها"
          onClick={() => router.push("/orghead/requests")}
        />
        <StatCard
          label="در انتظار تأیید نهایی"
          value={pendingFinalization}
          icon={Clock}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
          subtitle="نیازمند بررسی"
          onClick={() => router.push("/orghead/requests?tab=pending")}
        />
        <StatCard
          label="میانگین زمان تأیید"
          value={cycleTime ? `${Math.round(cycleTime.averageDays)} روز` : "—"}
          icon={Timer}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          subtitle={cycleTime ? `حداقل ${Math.round(cycleTime.minDays)} - حداکثر ${Math.round(cycleTime.maxDays)} روز` : undefined}
        />
        <StatCard
          label="مصرف بودجه"
          value={budgetUtilizationPct ? `${budgetUtilizationPct}%` : "—"}
          icon={BarChart3}
          iconColor={budgetUtilizationPct > 80 ? "text-ember" : "text-emerald-400"}
          iconBg={budgetUtilizationPct > 80 ? "bg-ember/10" : "bg-emerald-400/10"}
          subtitle={budgetBurn ? `${formatCurrency(budgetBurn.totalRemaining)} باقی‌مانده` : undefined}
        />
        <StatCard
          label="کالاهای کم‌موجودی"
          value={lowStockCount}
          icon={AlertTriangle}
          iconColor={lowStockCount > 0 ? "text-ember" : "text-emerald-400"}
          iconBg={lowStockCount > 0 ? "bg-ember/10" : "bg-emerald-400/10"}
          subtitle="موجودی انبار"
          onClick={() => router.push("/orghead/inventory")}
        />
      </div>

      {/* Section 3: PR Overview */}
      {(stats?.prStatusDistribution || stats?.prMonthlyTrend || stats?.selectionBreakdown) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="size-5 text-frost-link" />
            <h2 className="text-sm font-medium text-fog tracking-wide">نمای کلی درخواست‌های خرید</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {stats?.prStatusDistribution && (
              <PrStatusDonut data={stats.prStatusDistribution} />
            )}
            {stats?.prMonthlyTrend && (
              <PrMonthlyBar data={stats.prMonthlyTrend} />
            )}
            {stats?.selectionBreakdown && (
              <SelectionBreakdownPie data={stats.selectionBreakdown} />
            )}
          </div>
        </div>
      )}

      {/* Section 4: Budget Health */}
      {(stats?.budgetBurnDown || stats?.budgetLineBreakdown) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Landmark className="size-5 text-frost-link" />
            <h2 className="text-sm font-medium text-fog tracking-wide">وضعیت بودجه</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {stats?.budgetBurnDown && (
              <BudgetBurnKpi data={stats.budgetBurnDown} />
            )}
            {stats?.budgetLineBreakdown && (
              <BudgetLineBreakdown data={stats.budgetLineBreakdown} />
            )}
          </div>
        </div>
      )}

      {/* Section 5: Inventory */}
      {(stats?.inventorySummary || stats?.inventoryLowStock) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Warehouse className="size-5 text-frost-link" />
            <h2 className="text-sm font-medium text-fog tracking-wide">موجودی انبار</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {stats?.inventorySummary && (
              <InventorySummaryBar data={stats.inventorySummary} />
            )}
            {stats?.inventoryLowStock && (
              <InventoryLowStock data={stats.inventoryLowStock} />
            )}
          </div>
        </div>
      )}

      {/* Section 6: Consumption */}
      {(stats?.consumptionTrend || stats?.consumptionByUnit || stats?.consumptionByCategory) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="size-5 text-frost-link" />
            <h2 className="text-sm font-medium text-fog tracking-wide">تحلیل مصرف</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {stats?.consumptionTrend && (
              <ConsumptionTrendArea data={stats.consumptionTrend} />
            )}
            {stats?.consumptionByUnit && (
              <ConsumptionByUnitBar data={stats.consumptionByUnit} />
            )}
            {stats?.consumptionByCategory && (
              <ConsumptionByCategoryPie data={stats.consumptionByCategory} />
            )}
          </div>
        </div>
      )}

      {/* Section 7: Procurement & Process */}
      {(stats?.procurementByStore || stats?.stepBottleneck || stats?.stockMovementSummary) && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="size-5 text-frost-link" />
            <h2 className="text-sm font-medium text-fog tracking-wide">تدارکات و فرآیند</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {stats?.procurementByStore && (
              <ProcurementByStoreBar data={stats.procurementByStore} />
            )}
            {stats?.stepBottleneck && (
              <StepBottleneckBar data={stats.stepBottleneck} />
            )}
            {stats?.stockMovementSummary && (
              <StockMovementChart data={stats.stockMovementSummary} />
            )}
          </div>
        </div>
      )}

      {/* Section 8: Quick Access Nav Cards */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <p className="text-sm font-medium text-fog tracking-wide">دسترسی سریع</p>
          <CardTitle className="text-base font-medium text-frost-link mt-1">
            عملیات‌های مدیریت سازمان
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            <NavCard
              href="/orghead/requests"
              title="درخواست‌های خرید"
              description="مدیریت و بررسی همه درخواست‌ها"
              value={totalPRs}
              icon={ShoppingCart}
              iconColor="text-electric-iris"
              iconBg="bg-electric-iris/10"
            />
            <NavCard
              href="/orghead/units"
              title="واحدها"
              description="ساختار درختی واحدهای سازمان"
              icon={Building2}
              iconColor="text-sky-400"
              iconBg="bg-sky-400/10"
            />
            <NavCard
              href="/orghead/users"
              title="کاربران"
              description="مدیریت کاربران و نقش‌ها"
              icon={Users}
              iconColor="text-emerald-400"
              iconBg="bg-emerald-400/10"
            />
            <NavCard
              href="/orghead/processes"
              title="فرآیندها"
              description="طراحی و مدیریت گردش کار"
              icon={GitBranch}
              iconColor="text-violet-400"
              iconBg="bg-violet-500/10"
            />
            <NavCard
              href="/orghead/inventory"
              title="موجودی انبار"
              description="مشاهده موجودی کالاهای انبار"
              icon={Warehouse}
              iconColor="text-amber-400"
              iconBg="bg-amber-400/10"
            />
            <NavCard
              href="/orghead/consumption"
              title="مصرف کالا"
              description="ثبت و مشاهده مصرف"
              icon={ScrollText}
              iconColor="text-frost-link"
              iconBg="bg-frost-link/10"
            />
            <NavCard
              href="/orghead/stock-movements"
              title="گردش کالا"
              description="تاریخچه جابه‌جایی کالا"
              icon={Activity}
              iconColor="text-ember"
              iconBg="bg-ember/10"
            />
            <NavCard
              href="/orghead/org-chart"
              title="چارت سازمان"
              description="نمایش درختی ساختار سازمان"
              icon={Network}
              iconColor="text-cyan-400"
              iconBg="bg-cyan-400/10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fiscal Year info */}
      {stats?.fiscalYear?.active && (
        <Card variant="glass">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="size-5 text-frost-link" />
              <CardTitle className="text-sm font-medium text-fog">سال مالی جاری</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-glacier">{stats.fiscalYear.active.name}</p>
                <p className="text-xs text-fog/50 mt-1">
                  {new Date(stats.fiscalYear.active.startDate).toLocaleDateString("fa-IR")}
                  {" — "}
                  {new Date(stats.fiscalYear.active.endDate).toLocaleDateString("fa-IR")}
                </p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                فعال
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
