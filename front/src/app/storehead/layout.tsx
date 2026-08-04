import { PanelShell } from "@/components/layout/panel-shell"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function StoreHeadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredRoles={["StoreHead"]}>
      <PanelShell panel="storehead">{children}</PanelShell>
    </PanelGuard>
  )
}