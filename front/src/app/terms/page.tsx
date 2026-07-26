import { Sparkles } from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ComingSoonLayout } from "@/components/marketing/coming-soon-layout"

export default function TermsPage() {
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
        badge="در حال تدوین"
        headline="قوانین استفاده"
        gradientWord="از ساتک"
        description="در حال آماده‌سازی شرایط و قوانین استفاده از سامانه ساتک هستیم. به زودی این بخش تکمیل خواهد شد."
        showCountdown={false}
        showMockup={false}
      >
        <div className="mt-10 mx-auto max-w-lg">
          <div className="glass-card rounded-xl p-6 space-y-3 opacity-70 pointer-events-none">
            {[
              "شرایط ثبت‌نام و استفاده",
              "تعرفه‌ها و روش‌های پرداخت",
              "تعهدات و مسئولیت‌ها",
              "حقوق مالکیت فکری",
              "فسخ قرارداد",
              "قوانین و مقررات",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 py-2 border-b border-white/[0.03] last:border-0">
                <span className="text-sm text-fog/50">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-fog/40 text-center mt-4">قوانین کامل به زودی منتشر می‌شود</p>
        </div>
      </ComingSoonLayout>

      <SiteFooter />
    </div>
  )
}
