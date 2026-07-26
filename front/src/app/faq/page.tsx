import { Sparkles, HelpCircle } from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ComingSoonLayout } from "@/components/marketing/coming-soon-layout"

const placeholderQuestions = [
  "ساتک چه تفاوتی با سایر سامانه‌های مدیریت خرید دارد؟",
  "آیا ساتک از فرآیندهای خرید اختصاصی سازمان من پشتیبانی می‌کند؟",
  "مدت زمان پیاده‌سازی و راه‌اندازی ساتک چقدر است؟",
  "آیا امکان اتصال ساتک به نرم‌افزارهای حسابداری وجود دارد؟",
  "چه سطح‌های دسترسی و نقش‌هایی در ساتک تعریف شده است؟",
  "آیا ساتک از خرید ارزی و تأمین‌کنندگان خارجی پشتیبانی می‌کند؟",
]

export default function FAQPage() {
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
        badge="در حال تکمیل"
        headline="پاسخ سوالات شما"
        gradientWord="به زودی"
        description="در حال گردآوری جامع‌ترین پاسخ‌ها به سوالات متداول شما درباره ساتک، فرآیندها، تعرفه‌ها و امکانات هستیم."
        emailPlaceholder="ایمیل خود را برای اطلاع از پاسخ‌ها وارد کنید"
        ctaText="به‌محض انتشار خبرم کن"
        waitlistCount="۱,۰۳۴"
        waitlistLabel="نفر منتظر پاسخ سوالات هستند"
        showCountdown={false}
        showMockup={false}
      >
        <div className="mt-12 mx-auto max-w-2xl space-y-2 opacity-50 pointer-events-none">
          {placeholderQuestions.map((q, i) => (
            <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-3">
              <HelpCircle className="size-4 text-fog/30 shrink-0" />
              <span className="text-sm text-fog/50 text-right">{q}</span>
            </div>
          ))}
          <p className="text-xs text-fog/40 text-center pt-3">پاسخ هر سوال به زودی اضافه می‌شود</p>
        </div>
      </ComingSoonLayout>

      <SiteFooter />
    </div>
  )
}
