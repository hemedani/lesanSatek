import { PanelShell } from "@/components/layout/panel-shell"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function OrdinaryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredRoles={["Ordinary"]}>
      <PanelShell panel="ordinary">{children}</PanelShell>
    </PanelGuard>
  )
}