import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  MousePointer2,
  Workflow,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const showcaseSteps = [
  {
    title: "گردش کار را طراحی کنید",
    desc: "مراحل، نقش‌ها و قوانین تأیید را به‌صورت بصری کنار هم بچینید.",
  },
  {
    title: "نقش‌ها و مسئولان را تعیین کنید",
    desc: "هر گام را به واحد یا نقش مشخصی واگذار کنید.",
  },
  {
    title: "قوانین شرطی اضافه کنید",
    desc: "شاخه‌بندی بر اساس مبلغ، نوع کالا یا واحد درخواست‌کننده.",
  },
  {
    title: "فعال‌سازی و رهگیری",
    desc: "فرآیند را منتشر کنید و نتایج را لحظه‌ای رصد کنید.",
  },
]

interface ShowcaseNodeData {
  name: string
  type: string
  icon: typeof Workflow
  bg: string
  border: string
  text: string
  desc?: string
  active?: boolean
}

const graphNodes: ShowcaseNodeData[] = [
  {
    name: "ثبت درخواست",
    type: "اقدام",
    icon: Workflow,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
  },
  {
    name: "تأیید مدیر واحد",
    type: "تصویب",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    desc: "بررسی و تصویب توسط رئیس واحد",
    active: true,
  },
  {
    name: "بررسی مالی",
    type: "بررسی",
    icon: FileText,
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    text: "text-sky-400",
  },
  {
    name: "تحویل و پرداخت",
    type: "پرداخت",
    icon: Clock,
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
    text: "text-fuchsia-400",
  },
]

function EdgeLine({ active }: { active?: boolean }) {
  return (
    <div className="flex flex-col items-center py-1" aria-hidden>
      <svg width="28" height="40" viewBox="0 0 28 40" className="overflow-visible">
        <path
          d="M14 0 C 14 14, 14 22, 14 30"
          fill="none"
          stroke={active ? "#663af3" : "#3f4959"}
          strokeWidth="1.5"
          strokeDasharray="5 5"
          strokeLinecap="round"
          className={cn(
            "animate-blueprint-dash",
            active && "drop-shadow-[0_0_6px_rgba(102,58,243,0.65)]"
          )}
        />
        <path
          d="M14 0 C 14 14, 14 22, 14 30"
          fill="none"
          stroke={active ? "rgba(182,217,252,0.35)" : "rgba(186,215,247,0.12)"}
          strokeWidth="3.5"
          strokeLinecap="round"
          className="opacity-60"
        />
        <polygon
          points="14,37 9.5,29 18.5,29"
          fill={active ? "#663af3" : "#4a5568"}
          className={cn(active && "drop-shadow-[0_0_6px_rgba(102,58,243,0.8)]")}
        />
      </svg>
    </div>
  )
}

function ShowcaseNode({ node }: { node: (typeof graphNodes)[number] }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border p-4 text-start backdrop-blur-sm transition-all duration-200",
          node.bg,
          node.border,
          node.active
            ? "glass-card-active border-transparent shadow-[0_0_40px_-8px_rgba(102,58,243,0.45),0_24px_48px_-16px_rgba(0,0,0,0.6)]"
            : "glass-card-hover-active"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border",
              node.bg,
              node.border,
              node.text
            )}
          >
            <node.icon className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-glacier">{node.name}</span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]",
                  node.bg,
                  node.border,
                  node.text
                )}
              >
                {node.type}
              </span>
            </div>
            {"desc" in node && node.desc ? (
              <p className="mt-1 text-[11px] leading-relaxed text-fog/60">{node.desc}</p>
            ) : (
              <p className="mt-1 text-[11px] text-fog/30">واحد یا نقش مسئول</p>
            )}
          </div>
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-black/20 font-mono text-[10px] font-semibold text-fog/60 ring-1 ring-inset ring-white/[0.06]">
            {graphNodes.indexOf(node) + 1}
          </span>
        </div>
      </div>
      {graphNodes.indexOf(node) < graphNodes.length - 1 && (
        <EdgeLine active={node.active} />
      )}
    </div>
  )
}

const terminalJson = `{
  "title": "خرید تجهیزات اداری",
  "status": "active",
  "version": 3,
  "steps": [
    { "type": "Action",   "name": "ثبت درخواست",     "required": true },
    { "type": "Approval", "name": "تأیید مدیر واحد",  "required": true },
    { "type": "Review",   "name": "بررسی مالی",       "condition": "مبلغ > ۵۰٬۰۰۰٬۰۰۰" },
    { "type": "Payment",  "name": "تحویل و پرداخت",   "required": true }
  ]
}`

export function WorkflowShowcase() {
  return (
    <div className="glass-card-hover-active overflow-hidden rounded-2xl border border-white/[0.06]">
      <div className="flex items-center border-b border-white/[0.06]">
        {["ایجاد فرآیند", "تعیین نقش‌ها", "تنظیم قوانین", "فعال‌سازی"].map((step, i) => (
          <div
            key={step}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 py-3 text-xs font-medium",
              i < 3 ? "border-b-2 border-electric-iris text-electric-iris" : "text-fog/50"
            )}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-electric-iris/10 text-[10px] text-electric-iris">
              {i + 1}
            </span>
            {step}
            {i < 3 && <ChevronLeft className="hidden size-3 text-fog/30 sm:block" />}
          </div>
        ))}
      </div>

      <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="mb-6 flex items-center gap-2 text-sm text-glacier">
            <MousePointer2 className="size-4 text-electric-iris" />
            <span className="font-medium">چطور یک فرآیند ساخته می‌شود</span>
          </div>
          <ol className="relative space-y-8">
            {showcaseSteps.map((step, i) => (
              <li key={step.title} className="relative flex items-start gap-4">
                {i < showcaseSteps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute start-[7px] top-5 h-full w-px bg-gradient-to-b from-electric-iris/50 via-white/[0.06] to-transparent"
                  />
                )}
                <span
                  className={cn(
                    "relative mt-1 size-3.5 shrink-0 rounded-full ring-4 ring-electric-iris/10",
                    i === 0
                      ? "animate-dot-glow bg-electric-iris"
                      : i === 1
                        ? "bg-frost-link/80"
                        : "bg-steel-border"
                  )}
                />
                <div>
                  <h4 className="text-sm font-semibold text-glacier">{step.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-fog/60">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-3">
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-blueprint-grid-clear shadow-[inset_0_0_80px_-24px_rgba(186,207,247,0.12),0_24px_48px_-24px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs text-fog/60">
                <Workflow className="size-3.5 text-electric-iris" />
                <span>ویرایشگر فرآیند</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-fog/40">
                  نسخه ۳
                </span>
                <span className="flex items-center gap-1 rounded-md bg-electric-iris/10 px-2 py-0.5 text-[10px] text-electric-iris">
                  <span className="size-1 rounded-full bg-electric-iris" />
                  ویرایش
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center px-4 py-6">
              {graphNodes.map((node) => (
                <ShowcaseNode key={node.name} node={node} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-6 pb-6 md:px-8">
        <div className="mb-3 flex items-center gap-2 text-sm text-glacier">
          <Zap className="size-4 text-amber-400" />
          <span className="font-medium">خروجی فرآیند</span>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0d1a]">
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-ember/40" />
            <span className="size-2.5 rounded-full bg-amber-400/40" />
            <span className="size-2.5 rounded-full bg-cipher-mint/40" />
            <span className="ms-3 font-mono text-[11px] text-fog/60">process.json</span>
            <span className="ms-auto rounded-md bg-cipher-mint/10 px-2 py-0.5 text-[10px] font-medium text-cipher-mint">
              ذخیره شد
            </span>
          </div>
          <pre
            dir="ltr"
            className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-fog/70"
          >
            {terminalJson}
          </pre>
        </div>
      </div>
    </div>
  )
}
