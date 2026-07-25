import { PanelLayout } from "@/components/layout/panel-layout"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function OrgHeadLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard requiredRoles={["OrgHead"]}>
      <PanelLayout title="داشبورد سازمان" description="تأیید نهایی درخواست‌های خرید">
        {children}
      </PanelLayout>
    </PanelGuard>
  )
}
