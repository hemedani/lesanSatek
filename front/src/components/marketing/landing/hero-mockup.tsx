import {
  CheckCheck,
  Clock,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react"

const stats = [
  {
    icon: LayoutDashboard,
    label: "درخواست‌های فعال",
    value: "۱۲",
    color: "text-electric-iris",
    accent: "bg-electric-iris/10",
  },
  {
    icon: Clock,
    label: "منتظر تأیید",
    value: "۵",
    color: "text-amber-400",
    accent: "bg-amber-400/10",
  },
  {
    icon: CheckCheck,
    label: "تأیید شده امروز",
    value: "۸",
    color: "text-cipher-mint",
    accent: "bg-cipher-mint/10",
  },
  {
    icon: TrendingUp,
    label: "کاهش زمان فرآیند",
    value: "۶۰٪",
    color: "text-glacier",
    accent: "bg-white/[0.06]",
  },
]

const flowSteps = [
  { label: "درخواست خرید", desc: "ثبت توسط واحد درخواست‌کننده", status: "done" },
  { label: "تأیید مدیر", desc: "بررسی و تصویب", status: "active" },
  { label: "بررسی مالی", desc: "تخصیص بودجه", status: "todo" },
  { label: "تحویل و پرداخت", desc: "تسویه حساب", status: "todo" },
] as const

export function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-5xl [perspective:1400px]">
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[48px] bg-electric-iris/20 blur-[110px] animate-glow-breath"
      />

      <div className="relative [transform-style:preserve-3d] rotate-x-4 transition-transform duration-500 will-change-transform">
        <div className="glass-card rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-white/[0.1]" />
              <span className="size-2.5 rounded-full bg-white/[0.1]" />
              <span className="size-2.5 rounded-full bg-white/[0.1]" />
            </div>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="size-3.5 text-electric-iris" />
              <span className="text-xs font-medium text-glacier">داشبورد فرآیندهای سازمانی</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1">
              <span className="size-4 rounded-full bg-gradient-to-br from-electric-iris to-violet-500" />
              <span className="text-[10px] text-moonlight">مدیر فرآیندها</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-5">
            <div className="grid grid-cols-2 gap-3 md:col-span-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-electric-iris/25"
                >
                  <div className={`flex size-8 items-center justify-center rounded-lg ${item.accent}`}>
                    <item.icon className={`size-4 ${item.color}`} />
                  </div>
                  <p className={`mt-3 text-2xl font-bold tracking-tight ${item.color}`}>{item.value}</p>
                  <p className="mt-1 text-[10px] text-fog/70">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 md:col-span-2">
              <div className="flex items-center gap-2 pb-3">
                <Sparkles className="size-3.5 text-frost-link" />
                <span className="text-[11px] font-medium text-glacier">گردش کار خرید</span>
              </div>
              <div>
                {flowSteps.map((step, i) => (
                  <div key={step.label} className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1 size-2.5 shrink-0 rounded-full ${
                          step.status === "done"
                            ? "bg-cipher-mint"
                            : step.status === "active"
                              ? "bg-electric-iris ring-4 ring-electric-iris/20"
                              : "bg-white/[0.08]"
                        }`}
                      />
                      {i < flowSteps.length - 1 && (
                        <span
                          className={`w-px flex-1 ${
                            step.status === "done" ? "bg-cipher-mint/30" : "bg-white/[0.06]"
                          }`}
                        />
                      )}
                    </div>
                    <div className={i < flowSteps.length - 1 ? "pb-3.5" : ""}>
                      <p
                        className={`text-[11px] font-medium ${
                          step.status === "done"
                            ? "text-cipher-mint/90"
                            : step.status === "active"
                              ? "text-glacier"
                              : "text-fog/50"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-[9px] text-fog/40">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-fog">روند هزینه‌های ماهانه</span>
              <span className="text-[10px] font-medium text-cipher-mint">+۱۲٪ بهره‌وری</span>
            </div>
            <svg
              viewBox="0 0 320 64"
              className="mt-3 h-16 w-full"
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="heroSparkStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgba(102,58,243,0.15)" />
                  <stop offset="100%" stopColor="rgba(102,58,243,0.9)" />
                </linearGradient>
                <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(102,58,243,0.25)" />
                  <stop offset="100%" stopColor="rgba(102,58,243,0)" />
                </linearGradient>
              </defs>
              <path
                d="M0,50 L45,45 L85,52 L125,38 L165,42 L205,27 L245,31 L285,16 L320,10 L320,64 L0,64 Z"
                fill="url(#heroSparkFill)"
              />
              <polyline
                points="0,50 45,45 85,52 125,38 165,42 205,27 245,31 285,16 320,10"
                fill="none"
                stroke="url(#heroSparkStroke)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="320" cy="10" r="3" fill="#663af3" opacity="0.9" />
            </svg>
          </div>
        </div>
      </div>

      <div className="absolute -start-4 -top-6 hidden animate-float md:block" aria-hidden>
        <div className="glass-card flex items-center gap-2 rounded-xl px-3.5 py-2.5">
          <Zap className="size-4 text-amber-400" />
          <span className="text-xs font-medium text-glacier">کاهش ۶۰٪ زمان فرآیندها</span>
        </div>
      </div>

      <div className="absolute -bottom-8 -end-4 hidden animate-float-delayed md:block" aria-hidden>
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-[9px] text-fog/60">مبلغ تخصیص یافته</p>
              <p className="mt-1 text-sm font-bold tracking-tight text-cipher-mint">
                ۱٫۲۸۰٫۰۰۰٫۰۰۰
              </p>
              <p className="text-[9px] text-fog/40">ریال · تأیید مالی</p>
            </div>
            <div className="flex h-10 items-end gap-1" aria-hidden>
              <span className="w-1.5 rounded-sm bg-electric-iris/30" style={{ height: "35%" }} />
              <span className="w-1.5 rounded-sm bg-electric-iris/50" style={{ height: "60%" }} />
              <span className="w-1.5 rounded-sm bg-electric-iris/70" style={{ height: "45%" }} />
              <span className="w-1.5 rounded-sm bg-electric-iris" style={{ height: "85%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
