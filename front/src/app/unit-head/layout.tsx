import { PanelShell } from "@/components/layout/panel-shell"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function UnitHeadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredRoles={["UnitHead"]}>
      <PanelShell panel="unit-head">{children}</PanelShell>
    </PanelGuard>
  )
}