import { Sparkles } from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ComingSoonLayout } from "@/components/marketing/coming-soon-layout"

export default function AboutPage() {
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
        badge="داستان ما"
        headline="روایت پشت ساتک"
        gradientWord="به زودی"
        description="ساتک با هدف ساده‌سازی و هوشمندسازی فرآیندهای خرید سازمانی متولد شد. داستان تیم ما، مأموریت و ارزش‌هایی که دنبال می‌کنیم به زودی منتشر می‌شود."
        emailPlaceholder="ایمیل خود را برای شنیدن داستان ما وارد کنید"
        ctaText="از داستان ما باخبرم کن"
        waitlistCount="۵۴۲"
        waitlistLabel="نفر دنبال‌کننده ساتک"
        showCountdown={false}
        showMockup={false}
      >
        <div className="mt-10 mx-auto max-w-2xl">
          <div className="glass-card rounded-xl p-6 md:p-7 space-y-4 opacity-70">
            <p className="text-sm text-moonlight leading-relaxed">
              ساتک توسط تیمی از متخصصان فناوری اطلاعات و مدیریت فرآیندهای کسب‌وکار توسعه داده می‌شود. ما معتقدیم فرآیندهای خرید سازمانی می‌توانند شفاف‌تر، سریع‌تر و هوشمندتر از آنچه امروز هستند باشند.
            </p>
            <p className="text-sm text-fog leading-relaxed">
              مأموریت ما ایجاد سامانه‌ای است که نه‌تنها فرآیندها را دیجیتال کند، بلکه با ارائه بینش‌های تحلیلی و گزارش‌های هوشمند، به مدیران در تصمیم‌گیری‌های استراتژیک کمک کند.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="size-16 rounded-full bg-electric-iris/10 border border-electric-iris/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-electric-iris/40">?</span>
                </div>
                <span className="text-[10px] text-fog/40">عضو تیم</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-fog/40 text-center mt-4">تصاویر و مشخصات تیم به زودی اضافه می‌شود</p>
        </div>
      </ComingSoonLayout>

      <SiteFooter />
    </div>
  )
}
