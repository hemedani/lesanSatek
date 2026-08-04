import { PanelShell } from "@/components/layout/panel-shell"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function OrgHeadLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard requiredRoles={["OrgHead"]}>
      <PanelShell panel="orghead">{children}</PanelShell>
    </PanelGuard>
  )
}