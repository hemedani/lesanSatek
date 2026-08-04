import {
  ArrowLeft,
  Building2,
  Calculator,
  CheckCheck,
  Eye,
  FileCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Warehouse,
  Workflow,
  XCircle,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { SiteHeader } from "@/components/marketing/site-header"
import { SiteFooter } from "@/components/marketing/site-footer"
import { Reveal } from "@/components/marketing/landing/reveal"
import { HeroMockup } from "@/components/marketing/landing/hero-mockup"
import { FeatureCard } from "@/components/marketing/landing/feature-card"
import { TestimonialCard } from "@/components/marketing/landing/testimonial-card"
import { StepCard } from "@/components/marketing/landing/step-card"
import { WorkflowShowcase } from "@/components/marketing/landing/workflow-showcase"

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#05060f]">
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-blueprint-grid" />
        <div className="absolute inset-0 blueprint-glow" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <SiteHeader />
      <main>
        <HeroSection />
        <LogosSection />
        <ProblemSolutionSection />
        <FeaturesSection />
        <ShowcaseSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FinalCTASection />
      </main>
      <SiteFooter />
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative px-6 pb-20 pt-36 md:pb-24 md:pt-44">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-electric-iris/25 bg-electric-iris/5 px-4 py-1.5 shadow-[0_0_24px_-12px_rgba(102,58,243,0.5)]">
              <Sparkles className="size-3.5 text-electric-iris" />
              <span className="text-xs font-medium tracking-wide text-electric-iris">
                سامانه مدیریت فرآیندهای سازمانی
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-4xl font-bold leading-[1.2] tracking-tight text-glacier md:text-6xl lg:text-7xl">
              فرآیندهای خرید سازمانی را
              <br />
              <span className="bg-gradient-to-b from-glacier to-pebble bg-clip-text text-transparent">
                هوشمندانه مدیریت کنید
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ice md:text-lg">
              از درخواست خرید تا پرداخت — یکپارچه، هوشمند و کاملاً قابل شخصی‌سازی. سامانه‌ای کامل
              برای طراحی، اجرا و رهگیری گردش کار خرید سازمان شما.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex h-[52px] items-center justify-center gap-3 rounded-sm bg-electric-iris px-9 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-electric-iris/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_0_32px_-10px_rgba(102,58,243,0.55)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_0_44px_-8px_rgba(102,58,243,0.7)]"
              >
                <Zap className="size-5" />
                شروع کنید
                <ArrowLeft className="size-5 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-[52px] items-center justify-center gap-3 rounded-sm border border-steel-border/60 bg-transparent px-8 text-sm font-semibold text-moonlight transition-all duration-300 hover:-translate-y-0.5 hover:border-frost-link/40 hover:text-glacier"
              >
                <Eye className="size-5" />
                ورود به سامانه
              </Link>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <p className="mt-7 flex items-center justify-center gap-2 text-xs text-fog/70">
              <TrendingUp className="size-3.5 text-cipher-mint" />
              رایگان شروع کنید — بدون نیاز به کارت بانکی
            </p>
          </Reveal>
        </div>

        <Reveal delay={500} className="mt-20 md:mt-24">
          <HeroMockup />
        </Reveal>
      </div>
    </section>
  )
}

const logos = ["ایران خودرو", "سایپا", "فولاد مبارکه", "ملی مس", "گل گهر", "چادرملو"]

function LogosSection() {
  return (
    <section className="border-t border-white/[0.04] py-14 px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="mb-10 text-center text-xs font-medium tracking-widest text-fog/60">
            مورد اعتماد سازمان‌های بزرگ
          </p>
        </Reveal>
        <Reveal delay={150}>
          <div className="relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 start-0 z-10 w-24 bg-gradient-to-r from-[#05060f] to-transparent"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 end-0 z-10 w-24 bg-gradient-to-l from-[#05060f] to-transparent"
            />
            <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
              {[...logos, ...logos].map((name, i) => (
                <span
                  key={i}
                  className="whitespace-nowrap pe-16 text-sm font-semibold text-steel-border transition-colors duration-300 hover:text-fog"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const challenges = [
  {
    title: "فرآیندهای کاغذی و زمان‌بر",
    problem: "درخواست‌های خرید کاغذی بین واحدها دست‌به‌دست می‌شوند؛ پیگیری وضعیت سخت و کند است.",
    solution: "همه درخواست‌ها دیجیتال و قابل پیگیری‌اند؛ هر مرحله به‌صورت خودکار ثبت و اعلان می‌شود.",
  },
  {
    title: "عدم شفافیت در هزینه‌ها",
    problem: "بودجه‌ها دقیق مشخص نیستند؛ گزارش‌گیری از هزینه‌ها هفته‌ها زمان می‌برد.",
    solution: "داشبورد مالی زنده با گزارش‌های لحظه‌ای؛ تمام هزینه‌ها قابل رهگیری و تحلیل‌اند.",
  },
  {
    title: "هماهنگی دشوار بین واحدها",
    problem: "واحدها از وضعیت درخواست‌ها بی‌خبرند؛ تأییدیه‌ها گم می‌شوند یا دیر می‌رسند.",
    solution: "گردش کار خودکار با اعلان‌های هوشمند؛ هر واحد وظایف خود را دقیقاً می‌داند.",
  },
]

function ProblemSolutionSection() {
  return (
    <section className="py-20 px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-medium tracking-[0.15em] text-electric-iris">
              چالش → راهکار
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-glacier md:text-4xl">
              مدیریت خرید سنتی، سازمان شما را عقب نگه داشته
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-pebble">
              ساتک فرآیندهای خرید را دیجیتال، شفاف و هوشمند می‌کند.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {challenges.map((item, i) => (
            <Reveal key={item.title} delay={i * 120}>
              <div className="flex h-full flex-col justify-between">
                <div className="rounded-xl border border-ember/20 bg-white/[0.02] p-6 saturate-[0.7]">
                  <div className="flex items-center gap-2">
                    <XCircle className="size-4.5 text-ember/80" />
                    <span className="text-xs font-semibold text-ember/80">قبل از ساتک</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-fog">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-fog/60">{item.problem}</p>
                </div>

                <div aria-hidden className="relative my-1 flex h-9 items-center justify-center">
                  <span className="absolute inset-x-6 top-1/2 h-px bg-gradient-to-b from-ember/30 to-cipher-mint/30" />
                  <span className="relative flex size-6 items-center justify-center rounded-full border border-steel-border/40 bg-[#05060f]">
                    <ArrowLeft className="size-3 rotate-90 text-fog/60" />
                  </span>
                </div>

                <div className="glass-card group relative rounded-xl p-6 border-cipher-mint/25">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-xl opacity-40 shadow-[0_0_56px_-18px_rgba(38,150,132,0.55)] transition-opacity duration-300 group-hover:opacity-80"
                  />
                  <div className="relative flex items-center gap-2">
                    <CheckCheck className="size-4.5 text-cipher-mint" />
                    <span className="text-xs font-semibold text-cipher-mint">با ساتک</span>
                  </div>
                  <h3 className="relative mt-4 text-sm font-semibold text-glacier">{item.title}</h3>
                  <p className="relative mt-2 text-xs leading-relaxed text-moonlight/80">
                    {item.solution}
                  </p>
                </div>
              </div>
            </Reveal>
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
    <section id="ویژگی‌ها" className="border-t border-white/[0.04] py-20 px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-medium tracking-[0.15em] text-electric-iris">قابلیت‌ها</p>
            <h2 className="text-3xl font-semibold tracking-tight text-glacier md:text-4xl">
              همه آنچه برای مدیریت خرید نیاز دارید
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-pebble">
              ساتک از صفر تا صد فرآیند خرید سازمانی را پوشش می‌دهد.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 120}>
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ShowcaseSection() {
  return (
    <section className="py-20 px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-medium tracking-[0.15em] text-electric-iris">نمایش محصول</p>
            <h2 className="text-3xl font-semibold tracking-tight text-glacier md:text-4xl">
              گردش کار را خودتان طراحی کنید
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-pebble">
              با ویرایشگر بصری ساتک، فرآیندهای خرید سازمان را در چند دقیقه طراحی کنید.
            </p>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <WorkflowShowcase />
        </Reveal>
      </div>
    </section>
  )
}

const steps = [
  {
    number: "۰۱",
    title: "فرآیندها را طراحی کنید",
    description:
      "گردش کار خرید سازمان خود را با ویرایشگر بصری ساتک طراحی کنید. مراحل، نقش‌ها و قوانین را مشخص کنید.",
  },
  {
    number: "۰۲",
    title: "درخواست‌ها را ثبت کنید",
    description:
      "کاربران درخواست‌های خرید را ثبت می‌کنند. فرآیند خودکار شروع شده و همه مطلع می‌شوند.",
  },
  {
    number: "۰۳",
    title: "رهگیری و مدیریت کنید",
    description:
      "وضعیت همه درخواست‌ها را در لحظه ببینید. گزارش بگیرید و تصمیمات آگاهانه بگیرید.",
  },
]

function HowItWorksSection() {
  return (
    <section id="چگونگی" className="border-t border-white/[0.04] py-20 px-6 md:py-28">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="mb-20 text-center">
            <p className="mb-3 text-xs font-medium tracking-[0.15em] text-electric-iris">نحوه کار</p>
            <h2 className="text-3xl font-semibold tracking-tight text-glacier md:text-4xl">
              سه گام تا مدیریت هوشمند خرید
            </h2>
          </div>
        </Reveal>

        <div className="relative grid gap-16 md:grid-cols-3 md:gap-8">
          <Reveal
            delay={200}
            aria-hidden
            className="absolute inset-x-10 top-12 hidden md:block"
          >
            <div className="h-0 w-full origin-center border-t border-dashed border-steel-border/50" />
          </Reveal>

          {steps.map((step, i) => (
            <Reveal key={step.number} delay={i * 160}>
              <StepCard number={step.number} title={step.title} description={step.description} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

const testimonials = [
  {
    quote:
      "ساتک فرآیند خرید سازمان ما را متحول کرد. زمان تأیید درخواست‌ها از دو هفته به دو روز کاهش یافته. شفافیت مالی بی‌نظیری ایجاد شده است.",
    author: "مهندس رضا محمدی",
    role: "مدیر فناوری اطلاعات",
    company: "شرکت فولاد مبارکه",
    rating: 5,
  },
  {
    quote:
      "پیش از ساتک، پیگیری وضعیت درخواست‌های خرید یک کابوس بود. الان همه چیز شفاف و قابل رهگیری است. تیم ما حداقل ۵۰٪ زمان کمتری صرف هماهنگی می‌کند.",
    author: "دکتر سارا احمدی",
    role: "مدیر مالی",
    company: "گروه صنعتی گل گهر",
    rating: 5,
  },
  {
    quote:
      "طراحی فرآیندها با ویرایشگر بصری ساتک بسیار ساده است. بدون نیاز به برنامه‌نویس، گردش کار دلخواهمان را در چند دقیقه طراحی کردیم. یک محصول عالی برای سازمان‌های ایرانی.",
    author: "مهندس علی کاظمی",
    role: "مدیر برنامه‌ریزی",
    company: "شرکت ملی مس",
    rating: 5,
  },
]

function TestimonialsSection() {
  return (
    <section id="نظرات" className="py-20 px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-medium tracking-[0.15em] text-electric-iris">نظرات کاربران</p>
            <h2 className="text-3xl font-semibold tracking-tight text-glacier md:text-4xl">
              مورد اعتماد سازمان‌های پیشرو
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={t.author} delay={i * 120}>
              <TestimonialCard
                quote={t.quote}
                author={t.author}
                role={t.role}
                company={t.company}
                rating={t.rating}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTASection() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.04] py-20 px-6 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(102,58,243,0.14),rgba(5,6,15,0)_70%)]"
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-electric-iris/25 bg-electric-iris/5 px-4 py-1.5 shadow-[0_0_24px_-12px_rgba(102,58,243,0.5)]">
            <Sparkles className="size-3.5 text-electric-iris" />
            <span className="text-xs font-medium tracking-wide text-electric-iris">شروع رایگان</span>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="text-3xl font-bold leading-[1.2] tracking-tight text-glacier md:text-5xl">
            آماده‌اید فرآیندهای خرید
            <br />
            سازمان خود را متحول کنید؟
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-pebble">
            همین امروز شروع کنید. بدون نیاز به کارت بانکی، سامانه را به صورت رایگان آزمایش کنید.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex h-[58px] items-center justify-center gap-3 rounded-sm bg-electric-iris px-11 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-electric-iris/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_0_44px_-12px_rgba(102,58,243,0.6)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_0_60px_-8px_rgba(102,58,243,0.8)]"
            >
              <Zap className="size-5" />
              شروع کنید
              <ArrowLeft className="size-5 transition-transform duration-300 group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-[58px] items-center justify-center gap-3 rounded-sm border border-steel-border/60 bg-transparent px-9 text-base font-semibold text-moonlight transition-all duration-300 hover:-translate-y-0.5 hover:border-frost-link/40 hover:text-glacier"
            >
              <Eye className="size-5" />
              ورود به سامانه
            </Link>
          </div>
        </Reveal>

        <Reveal delay={400}>
          <p className="mt-7 text-xs text-fog/60">
            شروع رایگان · بدون نیاز به کارت بانکی · هر زمان لغو کنید
          </p>
        </Reveal>
      </div>
    </section>
  )
}
