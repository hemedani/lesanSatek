import { PanelGuard } from "@/components/auth/panel-guard"

export default function UnitHeadFinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredFeatures={["canManageBudget", "canIssuePaymentOrder", "canViewBudgetReports"]}>
      {children}
    </PanelGuard>
  )
}
