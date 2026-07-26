import {
  ArrowLeft,
  Sparkles,
  Workflow,
  ShoppingCart,
  Warehouse,
  Calculator,
  Eye,
  Zap,
  Users,
  CheckCheck,
  Layers,
  LayoutDashboard,
  ChevronLeft,
  Quote,
  Star,
  FileCheck,
  Route,
  Building2,
} from "lucide-react"
import Link from "next/link"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"

export default function Home() {
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
      <HeroSection />
      <LogosSection />
      <ProblemSolutionSection />
      <FeaturesSection />
      <ShowcaseSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FinalCTASection />
      <SiteFooter />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative pt-24 pb-16 md:pt-28 md:pb-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-electric-iris/20 bg-electric-iris/5 px-4 py-1.5 mb-6">
            <Sparkles className="size-3.5 text-electric-iris" />
            <span className="text-xs font-medium text-electric-iris tracking-wider">سامانه مدیریت فرآیندهای سازمانی</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-glacier leading-[1.15]">
            فرآیندهای خرید سازمانی را
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-iris to-violet-400">
              هوشمندانه مدیریت کنید
            </span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-pebble leading-relaxed max-w-xl mx-auto">
            از درخواست خرید تا پرداخت — یکپارچه، هوشمند، و کاملاً قابل شخصی‌سازی. سامانه‌ای کامل برای مدیریت گردش کار خرید سازمان شما.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-electric-iris px-7 text-sm font-medium text-white transition-all hover:bg-electric-iris/80 gap-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_0_24px_-6px_rgba(102,58,243,0.3)]"
            >
              شروع کنید
              <ArrowLeft className="size-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-sm border border-steel-border/60 bg-transparent px-6 text-sm font-medium text-moonlight transition-all hover:border-frost-link/30 hover:text-glacier gap-2"
            >
              <Eye className="size-4" />
              ورود به سامانه
            </Link>
          </div>
          <p className="mt-6 text-xs text-fog/60">رایگان شروع کنید — بدون نیاز به کارت بانکی</p>
        </div>

        <div className="relative mt-16 mx-auto max-w-5xl">
          <div className="glass-card-hover-active rounded-2xl overflow-hidden border border-white/[0.06]">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 border-b md:border-b-0 md:border-l border-white/[0.06] p-4 md:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
                  <LayoutDashboard className="size-4 text-electric-iris" />
                  <span className="text-xs font-medium text-glacier">داشبورد</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "درخواست‌های فعال", value: "۱۲", color: "text-electric-iris" },
                    { label: "منتظر تأیید", value: "۵", color: "text-amber-400" },
                    { label: "تأیید شده امروز", value: "۸", color: "text-cipher-mint" },
                    { label: "انجام شده", value: "۱۲۴", color: "text-glacier" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <p className="text-lg font-bold text-glacier">{item.value}</p>
                      <p className="text-[10px] text-fog/70">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-fog">آخرین درخواست‌ها</span>
                    <span className="text-[10px] text-fog/50">مشاهده همه</span>
                  </div>
                  {["تجهیزات اداری", "خدمات فناوری", "لوازم مصرفی"].map((item) => (
                    <div key={item} className="flex items-center justify-between py-1.5 border-b border-white/[0.03] last:border-0">
                      <span className="text-xs text-moonlight">{item}</span>
                      <span className="text-[10px] text-fog/50">در انتظار</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-[1.3] bg-[#0c0d1a] p-4 md:p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06] mb-4">
                  <Workflow className="size-4 text-frost-link" />
                  <span className="text-xs font-medium text-glacier">گردش کار خرید</span>
                </div>
                <div className="space-y-3">
                  {[
                    { step: "درخواست خرید", status: "completed", desc: "ثبت درخواست توسط واحد درخواست‌کننده" },
                    { step: "تأیید مدیر", status: "active", desc: "بررسی و تأیید توسط مدیر واحد" },
                    { step: "بررسی مالی", status: "pending", desc: "تخصیص بودجه و بررسی مالی" },
                    { step: "مناقصه", status: "pending", desc: "فرآیند مناقصه و انتخاب تأمین‌کننده" },
                    { step: "تحویل و پرداخت", status: "pending", desc: "تحویل کالا و تسویه حساب" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className={`size-4 rounded-full flex items-center justify-center ${
                          item.status === "completed" ? "bg-cipher-mint" :
                          item.status === "active" ? "bg-electric-iris" : "bg-white/[0.06]"
                        }`}>
                          {item.status === "completed" && <CheckCheck className="size-2.5 text-white" />}
                          {item.status === "active" && <div className="size-1.5 rounded-full bg-white" />}
                        </div>
                        {i < 4 && <div className="w-px h-4 bg-white/[0.06]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${
                          item.status === "completed" ? "text-cipher-mint" :
                          item.status === "active" ? "text-glacier" : "text-fog/50"
                        }`}>
                          {item.step}
                        </p>
                        <p className="text-[10px] text-fog/40">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-3 -left-3 glass-card rounded-lg px-3 py-2 hidden md:block">
            <div className="flex items-center gap-2">
              <Zap className="size-3.5 text-amber-400" />
              <span className="text-[11px] font-medium text-glacier">کاهش ۶۰٪ زمان فرآیندها</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const logos = ["ایران خودرو", "سایپا", "فولاد مبارکه", "ملی مس", "گل گهر", "چادرملو"]

function LogosSection() {
  return (
    <section className="border-t border-white/[0.04] py-12 px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-medium text-fog/60 tracking-widest mb-8">
          مورد اعتماد سازمان‌های بزرگ
        </p>
        <div className="flex items-center justify-center gap-8 md:gap-14 flex-wrap">
          {logos.map((name) => (
            <div
              key={name}
              className="text-sm font-semibold text-white/20 hover:text-white/40 transition-colors"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const problems = [
  {
    title: "فرآیندهای کاغذی و زمان‌بر",
    problem: "درخواست‌های خرید کاغذی بین واحدها دست‌به‌دست می‌شوند. پیگیری وضعیت سخت و کند است.",
    solution: "همه درخواست‌ها دیجیتال و قابل پیگیری هستند. هر مرحله به صورت خودکار ثبت و اعلان می‌شود.",
    icon: Layers,
  },
  {
    title: "عدم شفافیت در هزینه‌ها",
    problem: "بودجه‌ها دقیق مشخص نیست. گزارش‌گیری از هزینه‌ها هفته‌ها زمان می‌برد.",
    solution: "داشبورد مالی زنده با گزارش‌های لحظه‌ای. تمام هزینه‌ها قابل رهگیری و تحلیل هستند.",
    icon: Calculator,
  },
  {
    title: "هماهنگی دشوار بین واحدها",
    problem: "واحدها از وضعیت درخواست‌ها بی‌خبرند. تأییدیه‌ها گم می‌شوند یا دیر به دست می‌رسند.",
    solution: "گردش کار خودکار با اعلان‌های هوشمند. هر واحد وظایف خود را دقیقاً می‌داند.",
    icon: Users,
  },
]

function ProblemSolutionSection() {
  return (
    <section id="ویژگی‌ها" className="py-20 md:py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-xs font-medium text-electric-iris tracking-[0.15em] mb-3">چالش → راهکار</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-glacier tracking-tight">
            مدیریت خرید سنتی، سازمان شما را عقب نگه داشته
          </h2>
          <p className="mt-4 text-base text-pebble max-w-lg mx-auto leading-relaxed">
            ساتک فرآیندهای خرید را دیجیتال، شفاف و هوشمند می‌کند.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {problems.map((item) => (
            <div key={item.title} className="glass-card rounded-xl p-6 md:p-7 space-y-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-electric-iris/10">
                <item.icon className="size-5 text-electric-iris" />
              </div>
              <h3 className="text-base font-semibold text-glacier">{item.title}</h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-ember/5 border border-ember/10 p-3">
                  <p className="text-xs text-ember/80 leading-relaxed">
                    <span className="font-semibold text-ember">قبل از ساتک:</span> {item.problem}
                  </p>
                </div>
                <div className="rounded-lg bg-cipher-mint/5 border border-cipher-mint/10 p-3">
                  <p className="text-xs text-cipher-mint/80 leading-relaxed">
                    <span className="font-semibold text-cipher-mint">با ساتک:</span> {item.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const features = [
  {
    title: "طراحی فرآیند خرید",
    description: "گردش کار دلخواه خود را به صورت بصری طراحی کنید. مراحل تأیید، سطوح دسترسی و نقش‌ها را مشخص کنید.",
    icon: Workflow,
  },
  {
    title: "درخواست خرید هوشمند",
    description: "درخواست‌ها با فرم‌های هوشمند ثبت می‌شوند. وضعیت هر درخواست در لحظه قابل پیگیری است.",
    icon: ShoppingCart,
  },
  {
    title: "مدیریت انبار و کالا",
    description: "کنترل موجودی، طبقه‌بندی کالاها و رهگیری مصرف با گزارش‌های دقیق و لحظه‌ای.",
    icon: Warehouse,
  },
  {
    title: "بودجه و مالی یکپارچه",
    description: "تخصیص بودجه، کنترل هزینه‌ها و گزارش‌گیری مالی در یک داشبورد جامع.",
    icon: Calculator,
  },
  {
    title: "مدیریت تأمین‌کنندگان",
    description: "پروفایل تأمین‌کنندگان، تاریخچه قراردادها و ارزیابی عملکرد در یک سامانه.",
    icon: Building2,
  },
  {
    title: "گزارش‌های تحلیلی",
    description: "داشبوردهای تعاملی با نمودارهای بصری. تصمیم‌گیری بر اساس داده‌های دقیق.",
    icon: FileCheck,
  },
]

function FeaturesSection() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-white/[0.04]">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-xs font-medium text-electric-iris tracking-[0.15em] mb-3">قابلیت‌ها</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-glacier tracking-tight">
            همه آنچه برای مدیریت خرید نیاز دارید
          </h2>
          <p className="mt-4 text-base text-pebble max-w-lg mx-auto leading-relaxed">
            ساتک از صفر تا صد فرآیند خرید سازمانی را پوشش می‌دهد.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-card-hover-active rounded-xl p-5 md:p-6 space-y-3"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-electric-iris/10">
                <f.icon className="size-4.5 text-electric-iris" />
              </div>
              <h3 className="text-sm font-semibold text-glacier">{f.title}</h3>
              <p className="text-xs text-fog leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ShowcaseSection() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-xs font-medium text-electric-iris tracking-[0.15em] mb-3">نمایش محصول</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-glacier tracking-tight">
            گردش کار را خودتان طراحی کنید
          </h2>
          <p className="mt-4 text-base text-pebble max-w-lg mx-auto leading-relaxed">
            با ویرایشگر بصری ساتک، فرآیندهای خرید سازمان را در چند دقیقه طراحی کنید.
          </p>
        </div>
        <div className="glass-card-hover-active rounded-2xl overflow-hidden border border-white/[0.06]">
          <div className="flex items-center border-b border-white/[0.06]">
            {["ایجاد فرآیند", "تعیین نقش‌ها", "تنظیم قوانین", "فعال‌سازی"].map((step, i) => (
              <div
                key={step}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium ${
                  i < 3
                    ? "text-electric-iris border-b-2 border-electric-iris"
                    : "text-fog/50"
                }`}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-electric-iris/10 text-[10px] text-electric-iris">
                  {i + 1}
                </span>
                {step}
                {i < 3 && <ChevronLeft className="size-3 text-fog/30 hidden sm:block" />}
              </div>
            ))}
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-sm text-glacier">
                  <Workflow className="size-4 text-electric-iris" />
                  <span className="font-medium">ویرایشگر فرآیند</span>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4">
                  <div className="flex items-center justify-center h-40 md:h-48 relative">
                    <div className="flex items-center gap-8">
                      {["درخواست", "تأیید", "مالی", "انبار", "پرداخت"].map((node, i) => (
                        <div key={node} className="flex flex-col items-center gap-2">
                          <div className={`size-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                            i <= 1 ? "bg-electric-iris/20 text-electric-iris" :
                            i === 2 ? "bg-amber-400/10 text-amber-400" :
                            "bg-white/[0.06] text-fog/40"
                          }`}>
                            {i + 1}
                          </div>
                          <span className={`text-[10px] ${
                            i <= 1 ? "text-electric-iris" :
                            i === 2 ? "text-amber-400" :
                            "text-fog/40"
                          }`}>{node}</span>
                          {i < 4 && (
                            <div className="w-8 h-px bg-gradient-to-l from-electric-iris/40 to-transparent absolute translate-x-16" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-glacier mt-6">
                  <Zap className="size-4 text-amber-400" />
                  <span className="font-medium">خروجی</span>
                </div>
                <div className="rounded-lg bg-[#0c0d1a] border border-white/[0.06] p-4 font-mono text-[11px] leading-relaxed text-fog/60 overflow-x-auto">
                  <pre className="whitespace-pre-wrap" dir="ltr">{`Process: "خرید تجهیزات اداری"
├── ثبت درخواست (واحد درخواست‌کننده)
├── تأیید مدیر واحد
├── بررسی مالی (بودجه > ۵۰ میلیون)
├── مناقصه (۳ تأمین‌کننده)
└── تحویل و پرداخت`}</pre>
                </div>
              </div>
              <div className="flex-1">
                <div className="rounded-xl bg-[#0c0d1a] border border-white/[0.06] p-5 h-full flex items-center">
                  <div className="w-full rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-electric-iris to-violet-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">س</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-glacier">درخواست خرید جدید</p>
                          <p className="text-[10px] text-fog/50">شماره: PR-۱۴۰۴-۰۲۸</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-cipher-mint bg-cipher-mint/10 rounded-md px-2 py-0.5">فعال</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "عنوان", value: "تجهیزات شبکه و سرور" },
                        { label: "مبلغ", value: "۱٫۲۸۰٫۰۰۰٫۰۰۰ ریال" },
                        { label: "واحد درخواست‌کننده", value: "فناوری اطلاعات" },
                        { label: "وضعیت", value: "در انتظار تأیید مدیر" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="text-[10px] text-fog/60">{item.label}</span>
                          <span className="text-[11px] text-moonlight">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const steps = [
  {
    number: "۱",
    title: "فرآیندها را طراحی کنید",
    description: "گردش کار خرید سازمان خود را با ویرایشگر بصری ساتک طراحی کنید. مراحل، نقش‌ها و قوانین را مشخص کنید.",
    icon: Workflow,
  },
  {
    number: "۲",
    title: "درخواست‌ها را ثبت کنید",
    description: "کاربران درخواست‌های خرید را ثبت می‌کنند. فرآیند خودکار شروع شده و همه مطلع می‌شوند.",
    icon: ShoppingCart,
  },
  {
    number: "۳",
    title: "رهگیری و مدیریت کنید",
    description: "وضعیت همه درخواست‌ها را در لحظه ببینید. گزارش بگیرید و تصمیمات آگاهانه بگیرید.",
    icon: Route,
  },
]

function HowItWorksSection() {
  return (
    <section id="چگونگی" className="py-20 md:py-28 px-6 border-t border-white/[0.04]">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <p className="text-xs font-medium text-electric-iris tracking-[0.15em] mb-3">نحوه کار</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-glacier tracking-tight">
            سه گام تا مدیریت هوشمند خرید
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-l from-electric-iris/40 via-electric-iris/20 to-transparent" />
          {steps.map((step, i) => (
            <div key={step.number} className="text-center relative">
              <div className="flex size-20 items-center justify-center mx-auto rounded-2xl bg-electric-iris/5 border border-electric-iris/10 mb-5">
                <step.icon className="size-7 text-electric-iris" />
              </div>
              <span className="text-[11px] font-mono font-medium text-electric-iris/60">{step.number}</span>
              <h3 className="text-base font-semibold text-glacier mt-2">{step.title}</h3>
              <p className="text-xs text-fog leading-relaxed mt-2 max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const testimonials = [
  {
    quote: "ساتک فرآیند خرید سازمان ما را متحول کرد. زمان تأیید درخواست‌ها از دو هفته به دو روز کاهش یافته. شفافیت مالی بی‌نظیری ایجاد شده است.",
    author: "مهندس رضا محمدی",
    role: "مدیر فناوری اطلاعات",
    company: "شرکت فولاد مبارکه",
    rating: 5,
  },
  {
    quote: "پیش از ساتک، پیگیری وضعیت درخواست‌های خرید یک کابوس بود. الان همه چیز شفاف و قابل رهگیری است. تیم ما حداقل ۵۰٪ زمان کمتری صرف هماهنگی می‌کند.",
    author: "دکتر سارا احمدی",
    role: "مدیر مالی",
    company: "گروه صنعتی گل گهر",
    rating: 5,
  },
  {
    quote: "طراحی فرآیندها با ویرایشگر بصری ساتک بسیار ساده است. بدون نیاز به برنامه‌نویس، گردش کار دلخواهمان را در چند دقیقه طراحی کردیم. یک محصول عالی برای سازمان‌های ایرانی.",
    author: "مهندس علی کاظمی",
    role: "مدیر برنامه‌ریزی",
    company: "شرکت ملی مس",
    rating: 5,
  },
]

function TestimonialsSection() {
  return (
    <section id="نظرات" className="py-20 md:py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-xs font-medium text-electric-iris tracking-[0.15em] mb-3">نظرات کاربران</p>
          <h2 className="text-3xl md:text-4xl font-semibold text-glacier tracking-tight">
            مورد اعتماد سازمان‌های پیشرو
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map((t) => (
            <div key={t.author} className="glass-card rounded-xl p-6 md:p-7 flex flex-col">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <Quote className="size-5 text-electric-iris/30 mb-2" />
              <blockquote className="text-sm text-moonlight leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/[0.04]">
                <div className="size-9 rounded-full bg-gradient-to-br from-electric-iris to-violet-500 flex items-center justify-center text-[11px] font-bold text-white">
                  {t.author.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-xs font-semibold text-glacier">{t.author}</p>
                  <p className="text-[11px] text-fog">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTASection() {
  return (
    <section className="py-20 md:py-28 px-6 border-t border-white/[0.04]">
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-electric-iris/20 bg-electric-iris/5 px-4 py-1.5 mb-6">
          <Sparkles className="size-3.5 text-electric-iris" />
          <span className="text-xs font-medium text-electric-iris tracking-wider">شروع رایگان</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-semibold text-glacier tracking-tight leading-[1.15]">
          آماده اید فرآیندهای خرید
          <br />
          سازمان خود را متحول کنید؟
        </h2>
        <p className="mt-5 text-base text-pebble max-w-md mx-auto leading-relaxed">
          همین امروز شروع کنید. بدون نیاز به کارت بانکی، سامانه را به صورت رایگان آزمایش کنید.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-sm bg-electric-iris px-7 text-sm font-medium text-white transition-all hover:bg-electric-iris/80 gap-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_0_24px_-6px_rgba(102,58,243,0.3)]"
          >
            شروع کنید
            <ArrowLeft className="size-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-sm border border-steel-border/60 bg-transparent px-6 text-sm font-medium text-moonlight transition-all hover:border-frost-link/30 hover:text-glacier gap-2"
          >
            ورود به سامانه
          </Link>
        </div>
        <p className="mt-6 text-xs text-fog/60">شروع رایگان · بدون نیاز به کارت بانکی · هر زمان لغو کنید</p>
      </div>
    </section>
  )
}
