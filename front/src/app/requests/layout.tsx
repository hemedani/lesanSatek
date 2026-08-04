import { PanelShell } from "@/components/layout/panel-shell"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredRoles={["Employee"]}>
      <PanelShell panel="requests">{children}</PanelShell>
    </PanelGuard>
  )
}