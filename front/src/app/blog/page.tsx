import { Sparkles, BookOpen } from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ComingSoonLayout } from "@/components/marketing/coming-soon-layout"

const placeholderArticles = [
  { title: "مدیریت فرآیند خرید با هوش مصنوعی", category: "آموزشی", readTime: "۵ دقیقه" },
  { title: "بهترین روش‌های دیجیتال‌سازی فرآیندها", category: "راهنما", readTime: "۷ دقیقه" },
  { title: "مقایسه سامانه‌های مدیریت خرید ایرانی", category: "تحلیل", readTime: "۱۰ دقیقه" },
  { title: "چگونه بودجه خرید را بهینه مدیریت کنیم؟", category: "مدیریتی", readTime: "۴ دقیقه" },
  { title: "نقش تأییدیه‌های خودکار در کاهش هزینه‌ها", category: "تکنیکال", readTime: "۶ دقیقه" },
  { title: "از درخواست تا پرداخت: مسیر دیجیتال خرید", category: "آموزشی", readTime: "۸ دقیقه" },
]

export default function BlogPage() {
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
        headline="مقالات و بینش‌ها"
        gradientWord="در راه است"
        description="به زودی مقالاتی درباره مدیریت فرآیندهای خرید، دیجیتال‌سازی سازمانی، بهینه‌سازی هزینه‌ها و آخرین به‌روزرسانی‌های ساتک منتشر خواهیم کرد."
        emailPlaceholder="ایمیل خود را برای اطلاع از مقالات جدید وارد کنید"
        ctaText="به‌محض انتشار خبرم کن"
        waitlistCount="۸۹۶"
        waitlistLabel="نفر منتظر مقالات هستند"
        showCountdown={false}
      >
        <div className="mt-12 mx-auto max-w-5xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-50 pointer-events-none">
            {placeholderArticles.slice(0, 6).map((article, i) => (
              <div key={i} className="glass-card rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-electric-iris/60 bg-electric-iris/5 rounded-md px-2 py-0.5">{article.category}</span>
                  <span className="text-[10px] text-fog/40">{article.readTime}</span>
                </div>
                <h3 className="text-sm font-medium text-glacier leading-snug">{article.title}</h3>
                <div className="h-1.5 w-full rounded-sm bg-white/[0.04]" />
                <div className="h-1.5 w-2/3 rounded-sm bg-white/[0.04]" />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <BookOpen className="size-3.5 text-fog/40" />
            <span className="text-xs text-fog/40">مقالات به زودی منتشر می‌شوند</span>
          </div>
        </div>
      </ComingSoonLayout>

      <SiteFooter />
    </div>
  )
}
