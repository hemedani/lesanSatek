import { Sparkles, CheckCheck } from "lucide-react"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { ComingSoonLayout } from "@/components/marketing/coming-soon-layout"

const plans = [
  {
    name: "رایگان",
    description: "برای آشنایی با ساتک",
    price: "رایگان",
    features: ["تا ۱۰ درخواست خرید", "۱ فرآیند سفارشی", "۲ کاربر", "گزارش‌های پایه"],
  },
  {
    name: "حرفه‌ای",
    description: "برای تیم‌های در حال رشد",
    price: "—",
    features: ["درخواست نامحدود", "فرآیند نامحدود", "کاربر نامحدود", "گزارش‌های تحلیلی", "پشتیبانی優先", "API"],
    popular: true,
  },
  {
    name: "سازمانی",
    description: "برای سازمان‌های بزرگ",
    price: "—",
    features: ["همه امکانات حرفه‌ای", "نصب on-premise", "SLA تضمینی", "پشتیبانی اختصاصی", "شخصی‌سازی کامل", "داده‌های نامحدود"],
  },
]

export default function PricingPage() {
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
        headline="قیمت‌گذاری شفاف"
        gradientWord="در راه است"
        description="در حال نهایی‌سازی تعرفه‌ها هستیم. قیمت‌ها به زودی اعلام خواهد شد. همین حالا در لیست انتظار ثبت‌نام کنید."
        emailPlaceholder="ایمیل خود را برای اطلاع از قیمت‌ها وارد کنید"
        ctaText="از قیمت‌ها باخبرم کن"
        waitlistCount="۱,۸۹۲"
        waitlistLabel="نفر منتظر اعلام قیمت‌ها"
        showCountdown={false}
        showMockup={false}
      >
        <div className="mt-12 mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 pointer-events-none">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`glass-card rounded-xl p-6 md:p-7 flex flex-col ${
                  plan.popular ? "border-electric-iris/30 relative" : ""
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 inset-x-0 mx-auto w-fit rounded-full bg-electric-iris px-3 py-0.5 text-[10px] font-semibold text-white tracking-wider">
                    محبوب‌ترین
                  </span>
                )}
                <p className="text-sm font-semibold text-glacier">{plan.name}</p>
                <p className="text-xs text-fog/60 mt-0.5">{plan.description}</p>
                <p className="text-2xl font-bold text-glacier mt-4">
                  {plan.price}
                  {plan.price === "رایگان" && <span className="text-xs font-normal text-fog/60 mr-1">همیشه</span>}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 rounded-md px-2 py-0.5">به زودی</span>
                  <span className="text-[10px] text-fog/40">قیمت نهایی اعلام می‌شود</span>
                </div>
                <div className="mt-5 space-y-2 flex-1">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <CheckCheck className="size-3 text-cipher-mint shrink-0" />
                      <span className="text-xs text-fog">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ComingSoonLayout>

      <SiteFooter />
    </div>
  )
}
