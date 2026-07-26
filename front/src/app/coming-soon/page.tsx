import { Workflow, ShoppingCart, Sparkles } from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ComingSoonLayout } from "@/components/marketing/coming-soon-layout"

export default function ComingSoonPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#05060f] overflow-x-hidden">
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-blueprint-grid" />
        <div className="absolute inset-0 blueprint-glow" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <SiteHeader />

      <ComingSoonLayout
        badge="به زودی — پاییز ۱۴۰۴"
        headline="نسخه جدید ساتک"
        gradientWord="در راه است"
        description="نسخه جدید ساتک با قابلیت‌های پیشرفته‌تر، طراحی مدرن‌تر و تجربه کاربری بهتر به زودی منتشر می‌شود. اولین نفری باشید که از تغییرات مطلع می‌شوید."
        waitlistCount="۱,۲۴۷"
        waitlistLabel="نفر منتظر نسخه جدید هستند"
      >
        <div className="relative mt-10 md:mt-14 mx-auto max-w-4xl w-full">
          <div className="glass-card-hover-active rounded-2xl overflow-hidden border border-white/[0.06]">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 border-b md:border-b-0 md:border-l border-white/[0.06] p-5 space-y-4 opacity-60">
                <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
                  <Workflow className="size-4 text-electric-iris" />
                  <span className="text-xs font-medium text-glacier">داشبورد جدید</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                      <div className="h-2 w-16 rounded-sm bg-white/[0.06]" />
                      <div className="h-6 w-full rounded-sm bg-white/[0.04]" />
                      <div className="h-2 w-12 rounded-sm bg-white/[0.04]" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-[1.3] bg-[#0c0d1a] p-5 opacity-60">
                <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06] mb-4">
                  <ShoppingCart className="size-4 text-frost-link" />
                  <span className="text-xs font-medium text-glacier">گردش کار جدید</span>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="size-4 rounded-full bg-white/[0.06]" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-24 rounded-sm bg-white/[0.06]" />
                        <div className="h-2 w-32 rounded-sm bg-white/[0.04]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#05060f] via-transparent to-[#05060f] pointer-events-none rounded-2xl" />
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <div className="glass-card rounded-full px-5 py-2 flex items-center gap-2">
              <Sparkles className="size-3.5 text-electric-iris" />
              <span className="text-xs font-medium text-glacier">در حال توسعه — پاییز ۱۴۰۴</span>
            </div>
          </div>
        </div>
      </ComingSoonLayout>

      <SiteFooter />
    </div>
  )
}
