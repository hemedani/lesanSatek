import { PanelLayout } from "@/components/layout/panel-layout"
import { PanelGuard } from "@/components/auth/panel-guard"

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PanelGuard requiredFeatures={["canRespondToTender"]}>
      <PanelLayout title="پنل فروشندگان" description="مناقصات و پیشنهادهای فروش">
        {children}
      </PanelLayout>
    </PanelGuard>
  )
}
