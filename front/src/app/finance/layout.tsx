import { PanelLayout } from "@/components/layout/panel-layout"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredFeatures={["canManageBudget"]}>
      <PanelLayout title="پنل مالی" description="مدیریت بودجه و پرداخت‌ها">
        {children}
      </PanelLayout>
    </PanelGuard>
  )
}
