import { getMe } from "@/app/actions/auth/getMe"
import { dashboardStatistic } from "@/app/actions/user/dashboardStatistic"
import { OrgHeadDashboardClient } from "./dashboard-client"

export default async function OrgHeadDashboard() {
  let meRes: Awaited<ReturnType<typeof getMe>> = { success: false, body: null }
  let statsRes: Awaited<ReturnType<typeof dashboardStatistic>> = { success: false, body: null }

  try {
    const [m, s] = await Promise.all([
      getMe({
        _id: 1,
        first_name: 1,
        last_name: 1,
        roles: 1,
        organizations: { _id: 1, name: 1 },
      }),
      dashboardStatistic(
        { type: "orgHead" },
        {
          unit: 1,
          purchasingRequestCounts: 1,
          pendingApprovalCount: 1,
          recentApprovals: 1,
          finance: 1,
          receiptCount: 1,
          fiscalYear: 1,
          paymentOrders: 1,
          prStatusDistribution: 1,
          prMonthlyTrend: 1,
          prCycleTime: 1,
          budgetLineBreakdown: 1,
          budgetBurnDown: 1,
          inventorySummary: 1,
          inventoryLowStock: 1,
          consumptionTrend: 1,
          consumptionByUnit: 1,
          consumptionByCategory: 1,
          procurementByStore: 1,
          selectionBreakdown: 1,
          stockMovementSummary: 1,
          stepBottleneck: 1,
        },
      ),
    ])
    meRes = m
    statsRes = s
  } catch {
    // fall through with default error values
  }

  const me = meRes.success ? meRes.body : null
  const stats = statsRes.success ? statsRes.body : null
  const organization = me?.organizations?.[0] ?? null

  return (
    <OrgHeadDashboardClient
      organization={organization}
      stats={stats}
    />
  )
}
