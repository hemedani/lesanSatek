import { Sparkles, GitCompare } from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ComingSoonLayout } from "@/components/marketing/coming-soon-layout"

export default function ChangelogPage() {
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
        badge="به زودی"
        headline="تغییرات و به‌روزرسانی‌ها"
        gradientWord="ساتک"
        description="تاریخچه تغییرات ساتک، نسخه‌های جدید، بهبودها و رفع مشکلات به زودی در این صفحه قابل مشاهده خواهد بود."
        emailPlaceholder="ایمیل خود را برای اطلاع از به‌روزرسانی‌ها وارد کنید"
        ctaText="از تغییرات باخبرم کن"
        waitlistCount="۵۱۸"
        waitlistLabel="نفر دنبال‌کننده تغییرات"
        showCountdown={false}
        showMockup={false}
      >
        <div className="mt-10 mx-auto max-w-xl">
          <div className="glass-card rounded-xl p-6 opacity-50 pointer-events-none">
            <div className="flex items-center gap-3 mb-4">
              <GitCompare className="size-4 text-fog/30" />
              <span className="text-xs font-medium text-fog/40">تغییرات اخیر</span>
            </div>
            {[
              { version: "v1.0.0", date: "پاییز ۱۴۰۴", desc: "نسخه اولیه ساتک با قابلیت‌های پایه" },
            ].map((item) => (
              <div key={item.version} className="flex items-start gap-3 py-3 border-t border-white/[0.03]">
                <span className="text-xs font-semibold text-glacier min-w-16">{item.version}</span>
                <span className="text-[10px] text-fog/50 min-w-16">{item.date}</span>
                <span className="text-xs text-fog/60">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-fog/40 text-center mt-4">آرشیو کامل تغییرات به زودی منتشر می‌شود</p>
        </div>
      </ComingSoonLayout>

      <SiteFooter />
    </div>
  )
}
