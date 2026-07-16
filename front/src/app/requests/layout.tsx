import { PanelLayout } from "@/components/layout/panel-layout"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredRoles={["Employee"]}>
      <PanelLayout title="درخواست‌های خرید" description="ثبت و پیگیری درخواست‌ها">
        {children}
      </PanelLayout>
    </PanelGuard>
  )
}
