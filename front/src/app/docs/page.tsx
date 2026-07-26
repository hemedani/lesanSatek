import { Sparkles, BookText } from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ComingSoonLayout } from "@/components/marketing/coming-soon-layout"

const docSections = [
  { title: "شروع سریع", desc: "راه‌اندازی ساتک در ۱۰ دقیقه" },
  { title: "راهنمای ثبت‌نام", desc: "ایجاد حساب کاربری و تنظیمات اولیه" },
  { title: "مدیریت فرآیندها", desc: "طراحی و ویرایش گردش کار خرید" },
  { title: "راهنمای کاربران", desc: "ثبت درخواست و پیگیری وضعیت" },
  { title: "گزارش‌گیری", desc: "تحلیل داده‌ها و خروجی گزارش" },
  { title: "API و توسعه", desc: "اتصال سامانه‌های دیگر به ساتک" },
]

export default function DocsPage() {
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
        badge="در حال نگارش"
        headline="مستندات جامع ساتک"
        gradientWord="به زودی"
        description="تیم فنی ساتک در حال آماده‌سازی مستندات کامل شامل راهنمای شروع سریع، آموزش کاربران، مستندات API و راهنماهای عیب‌یابی است."
        emailPlaceholder="ایمیل خود را برای اطلاع از انتشار مستندات وارد کنید"
        ctaText="از انتشار مستندات باخبرم کن"
        waitlistCount="۷۶۱"
        waitlistLabel="نفر منتظر مستندات"
        showCountdown={false}
        showMockup={false}
      >
        <div className="mt-12 mx-auto max-w-4xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-50 pointer-events-none">
            {docSections.map((section) => (
              <div key={section.title} className="glass-card rounded-xl p-5 space-y-2">
                <BookText className="size-4 text-electric-iris/40" />
                <h3 className="text-sm font-medium text-glacier">{section.title}</h3>
                <p className="text-xs text-fog/50">{section.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-fog/40 text-center mt-4">مستندات کامل به زودی منتشر می‌شود</p>
        </div>
      </ComingSoonLayout>

      <SiteFooter />
    </div>
  )
}
