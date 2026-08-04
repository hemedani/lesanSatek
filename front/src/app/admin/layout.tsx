import { PanelShell } from "@/components/layout/panel-shell"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <PanelShell panel="admin">{children}</PanelShell>
    </AuthGuard>
  )
}