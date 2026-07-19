import { PanelLayout } from "@/components/layout/panel-layout"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function StoreHeadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredRoles={["StoreHead"]}>
      <PanelLayout title="پنل مدیریت فروشگاه" description="مدیریت فروشگاه، کالاها و مناقصات">
        {children}
      </PanelLayout>
    </PanelGuard>
  )
}
