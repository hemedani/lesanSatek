import { Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ReactNode } from "react"

interface ComingSoonLayoutProps {
  badge: string
  headline: string
  gradientWord: string
  description: string
  emailPlaceholder?: string
  ctaText?: string
  waitlistCount?: string
  waitlistLabel?: string
  children?: ReactNode
  showCountdown?: boolean
  showMockup?: boolean
}

const countdownUnits = [
  { label: "روز", value: "۸۷" },
  { label: "ساعت", value: "۱۴" },
  { label: "دقیقه", value: "۳۸" },
  { label: "ثانیه", value: "۲۲" },
]

export function ComingSoonLayout({
  badge,
  headline,
  gradientWord,
  description,
  emailPlaceholder = "ایمیل خود را وارد کنید",
  ctaText = "اطلاع‌رسانی کن",
  waitlistCount,
  waitlistLabel,
  children,
  showCountdown = true,
  showMockup = true,
}: ComingSoonLayoutProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12 md:pt-28 md:pb-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-electric-iris/20 bg-electric-iris/5 px-4 py-1.5 mb-6">
          <Sparkles className="size-3.5 text-electric-iris" />
          <span className="text-xs font-medium text-electric-iris tracking-wider">{badge}</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-glacier leading-[1.2]">
          {headline}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-electric-iris to-violet-400">
            {gradientWord}
          </span>
        </h1>
        <p className="mt-5 text-base md:text-lg text-pebble leading-relaxed max-w-md mx-auto">
          {description}
        </p>

        {children}

        <div className="mt-10 mx-auto max-w-md">
          <form className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="coming-soon-email" className="sr-only">آدرس ایمیل</label>
              <input
                id="coming-soon-email"
                type="email"
                placeholder={emailPlaceholder}
                className="w-full h-11 rounded-sm border border-steel-border/60 bg-midnight-ink/60 px-4 text-sm text-moonlight placeholder:text-fog/40 outline-none transition-all focus:border-ring focus:ring-3 focus:ring-ring/50 hover:border-frost-link/20"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-sm bg-electric-iris px-6 text-sm font-medium text-white transition-all hover:bg-electric-iris/80 gap-2 shrink-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_0_24px_-6px_rgba(102,58,243,0.3)]"
            >
              {ctaText}
              <ArrowLeft className="size-4" />
            </button>
          </form>
          <p className="mt-3 text-xs text-fog/50">
            بدون ارسال هرزنامه — هر زمان می‌توانید لغو کنید.
          </p>
        </div>

        {(waitlistCount || waitlistLabel) && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <div className="flex -space-x-2 space-x-reverse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="size-7 rounded-full border-2 border-midnight-ink bg-gradient-to-br from-electric-iris to-violet-500 flex items-center justify-center text-[9px] font-bold text-white"
                >
                  {["م", "س", "ع", "ف", "ک"][i]}
                </div>
              ))}
            </div>
            <p className="text-xs text-fog">
              <span className="text-glacier font-semibold">{waitlistCount}</span> {waitlistLabel}
            </p>
          </div>
        )}

        {showCountdown && (
          <div className="mt-10 flex items-center justify-center gap-6 md:gap-10">
            {countdownUnits.map((unit) => (
              <div key={unit.label} className="text-center">
                <div className="text-2xl md:text-3xl font-semibold text-glacier tabular-nums">{unit.value}</div>
                <div className="text-[10px] font-medium text-fog/50 tracking-wider mt-1">{unit.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
