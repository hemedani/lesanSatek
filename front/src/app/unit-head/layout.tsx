import { PanelLayout } from "@/components/layout/panel-layout"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function UnitHeadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredRoles={["UnitHead"]}>
      <PanelLayout title="پنل واحد" description="تایید درخواست‌های خرید">
        {children}
      </PanelLayout>
    </PanelGuard>
  )
}
