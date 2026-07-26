import { Sparkles, Mail } from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ComingSoonLayout } from "@/components/marketing/coming-soon-layout"

export default function ContactPage() {
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
        headline="مشتاق شنیدن از شما هستیم"
        gradientWord="در تماس باشید"
        description="تیم ساتک به زودی آماده پاسخگویی به سوالات و پیشنهادهای شما خواهد بود. در حال راه‌اندازی کامل سامانه پشتیبانی هستیم."
        emailPlaceholder="ایمیل خود را وارد کنید"
        ctaText="خبرم کن"
        waitlistCount="۶۷۳"
        waitlistLabel="نفر منتظر ارتباط با تیم ساتک"
        showCountdown={false}
      >
        <div className="mt-10 mx-auto max-w-lg">
          <div className="glass-card rounded-xl p-6 md:p-7 space-y-5 opacity-70">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.06]">
              <Mail className="size-4 text-electric-iris" />
              <span className="text-xs font-medium text-glacier">فرم تماس (به زودی)</span>
            </div>
            <div className="space-y-3">
              <div className="h-10 rounded-sm border border-steel-border/40 bg-white/[0.02] px-3 flex items-center">
                <span className="text-xs text-fog/40">نام و نام خانوادگی</span>
              </div>
              <div className="h-10 rounded-sm border border-steel-border/40 bg-white/[0.02] px-3 flex items-center">
                <span className="text-xs text-fog/40">ایمیل</span>
              </div>
              <div className="h-24 rounded-sm border border-steel-border/40 bg-white/[0.02] px-3 py-2.5">
                <span className="text-xs text-fog/40">پیام شما...</span>
              </div>
              <div className="inline-flex h-10 items-center justify-center rounded-sm bg-electric-iris/40 px-4 text-xs font-medium text-white/60 gap-1.5 w-full">
                ارسال پیام
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </div>
            </div>
            <p className="text-[11px] text-fog/40 text-center">فرم تماس به زودی فعال می‌شود</p>
          </div>
          <p className="text-xs text-fog/40 text-center mt-4">
            تا آن زمان می‌توانید از طریق ایمیل با ما در ارتباط باشید
          </p>
        </div>
      </ComingSoonLayout>

      <SiteFooter />
    </div>
  )
}
