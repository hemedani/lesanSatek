"use client"

import { useState } from "react"
import {
  Check,
  X,
  Loader2,
  User,
  Clock,
  ChevronDown,
  Building2,
  Briefcase,
  ShieldCheck,
  GitBranch,
  Circle,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StepApprovalInline {
  _id: string
  status?: string
  comment?: string
  decidedAt?: string
  decidedBy?: { _id?: string; first_name?: string; last_name?: string; position?: string; roles?: { name?: string }[] }
  unit?: {
    _id: string
    name?: string
    head?: { _id?: string; first_name?: string; last_name?: string; position?: string; roles?: { name?: string }[] }
  }
}

interface ProcessStep {
  _id: string
  name?: string
  order?: number
  description?: string
  stepType?: string
  required?: boolean
  groupsOperator?: string
  assigneeGroups?: { operator?: string; unitIds?: string[] }[]
  approvals?: StepApprovalInline[]
}

interface StepApproval {
  _id: string
  status?: string
  comment?: string
  decidedAt?: string
  decidedBy?: { _id?: string; first_name?: string; last_name?: string; position?: string; roles?: { name?: string }[] }
  processStep?: { _id?: string; name?: string }
  unit?: { _id?: string; name?: string }
}

interface ResponsibleUnit {
  _id?: string
  name?: string
  head?: { _id?: string; first_name?: string; last_name?: string; position?: string; roles?: { name?: string }[] }
}

interface WorkflowVisualizerProps {
  steps: ProcessStep[]
  currentStepIndex?: number
  status?: string
  approvals?: StepApproval[]
  stepResponsibleUnits?: Record<string, ResponsibleUnit[]>
}

const roleLabelMap: Record<string, string> = {
  Manager: "مدیر",
  Admin: "مدیر سیستم",
  Employee: "کارمند",
  Ordinary: "کاربر عادی",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
  StoreHead: "رئیس فروشگاه",
}

const stepTypeLabel: Record<string, string> = {
  Approval: "تأیید",
  Review: "بررسی",
  Notification: "اطلاع‌رسانی",
  Action: "اقدام",
  Delivery: "تحویل",
  Receipt: "دریافت",
  Payment: "پرداخت",
}

function labelForRole(name?: string): string {
  return name ? (roleLabelMap[name] || name) : ""
}

function faNum(n: number): string {
  return n.toLocaleString("fa-IR")
}

function fullName(p?: { first_name?: string; last_name?: string }): string {
  if (!p) return ""
  return `${p.first_name || ""} ${p.last_name || ""}`.trim()
}

function formatDateTime(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  return `${d.toLocaleDateString("fa-IR")} — ${d.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`
}

type StepState = "done" | "current" | "upcoming" | "failed"

export function WorkflowVisualizer({
  steps,
  currentStepIndex = 0,
  status,
  approvals,
  stepResponsibleUnits,
}: WorkflowVisualizerProps) {
  const s = (status || "").toLowerCase()
  const isComplete = s === "completed" || s === "approved" || s === "pendingfinalization"
  const isRejected = s === "rejected" || s === "cancelled"
  const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0))

  const activeStep = sortedSteps.find((st) => st.order === currentStepIndex) || sortedSteps[currentStepIndex] || null
  const activeStepId = activeStep?._id ?? null

  const approvalMap = new Map<string, StepApproval>()
  if (approvals) {
    for (const a of approvals) {
      const stepId = a.processStep?._id
      if (stepId) approvalMap.set(stepId, a)
    }
  }

  function isStepFullyApproved(stepId: string): boolean {
    const stepApprovals = approvals?.filter((a) => a.processStep?._id === stepId) || []
    const stepUnits = stepResponsibleUnits?.[stepId] || []
    if (stepUnits.length === 0) return false
    return stepUnits.every((unit) =>
      stepApprovals.some((a) => a.unit?._id === unit._id && a.status === "approved")
    )
  }

  let displayStep = activeStep
  if (!isComplete && !isRejected && activeStepId && isStepFullyApproved(activeStepId)) {
    const nextIdx = sortedSteps.findIndex(
      (st) => (st.order || 0) > (activeStep?.order || 0) && !isStepFullyApproved(st._id)
    )
    if (nextIdx !== -1) displayStep = sortedSteps[nextIdx]
  }
  const displayStepId = displayStep?._id ?? null
  const displayIdx = sortedSteps.findIndex((st) => st._id === displayStepId)

  const [selectedStepId, setSelectedStepId] = useState<string | null>(displayStepId)
  const selectedStep =
    sortedSteps.find((st) => st._id === selectedStepId) || displayStep || sortedSteps[0] || null

  function stateFor(step: ProcessStep): StepState {
    const stepIdx = sortedSteps.findIndex((st) => st._id === step._id)
    if (isRejected && step._id === activeStepId) return "failed"
    if (isComplete) return "done"
    if (step._id === displayStepId) return "current"
    if (stepIdx < displayIdx || isStepFullyApproved(step._id)) return "done"
    return "upcoming"
  }

  const overallChip = isComplete
    ? { label: "تکمیل شده", cls: "bg-cipher-mint/10 text-cipher-mint border-cipher-mint/25" }
    : isRejected
      ? { label: "رد شده", cls: "bg-rose-500/10 text-rose-400 border-rose-500/25" }
      : { label: "در جریان", cls: "bg-electric-iris/10 text-electric-iris border-electric-iris/25" }

  if (!sortedSteps.length) {
    return (
      <div className="rounded-2xl border border-steel-border/20 bg-white/[0.02] p-8 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
          <GitBranch className="size-6 text-fog/40" />
        </div>
        <p className="text-body text-fog/60">هیچ مرحله‌ای برای این فرآیند تعریف نشده است.</p>
      </div>
    )
  }

  return (
    <div className="glass-card glass-card-hover-active relative rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20">
            <GitBranch className="size-5 text-electric-iris" />
          </div>
          <div>
            <h3 className="text-subheading font-medium text-glacier">گردش کار فرآیند</h3>
            <p className="text-body-sm text-fog">{faNum(sortedSteps.length)} مرحله</p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-body-sm font-medium",
            overallChip.cls
          )}
        >
          {isComplete ? <Check className="size-4" /> : isRejected ? <X className="size-4" /> : <Loader2 className="size-4 animate-spin" />}
          {overallChip.label}
        </span>
      </div>

      {/* ── Desktop horizontal stepper ─────────────────────────────── */}
      <ol className="mt-8 hidden lg:flex">
        {sortedSteps.map((step, i) => {
          const state = stateFor(step)
          const isSelected = selectedStepId === step._id
          const approval = approvalMap.get(step._id)
          const actorName =
            approval?.decidedBy ? fullName(approval.decidedBy) : undefined
          const stepUnits = stepResponsibleUnits?.[step._id] || []
          const firstUnit = stepUnits[0]

          return (
            <li key={step._id} className="relative min-w-0 flex-1">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setSelectedStepId(step._id)}
                  aria-current={state === "current" ? "step" : undefined}
                  aria-label={`${step.name || `مرحله ${faNum(i + 1)}`} — ${state === "current" ? "مرحله جاری" : state === "done" ? "تکمیل شده" : "در پیش"}`}
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    state === "done" && "bg-cipher-mint/15 text-cipher-mint ring-1 ring-cipher-mint/30 shadow-[0_0_14px_rgba(38,150,132,0.22)]",
                    state === "current" && "bg-electric-iris/15 text-electric-iris ring-1 ring-electric-iris/40 shadow-[0_0_20px_rgba(102,58,243,0.4)]",
                    state === "upcoming" && "bg-white/[0.03] text-fog/50 ring-1 ring-steel-border/25",
                    state === "failed" && "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30"
                  )}
                >
                  {state === "done" ? (
                    <Check className="size-5" strokeWidth={2.5} />
                  ) : state === "current" ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : state === "failed" ? (
                    <X className="size-5" strokeWidth={2.5} />
                  ) : (
                    <span className="text-sm font-semibold">{faNum(i + 1)}</span>
                  )}
                </button>

                {i < sortedSteps.length - 1 && (
                  <div
                    aria-hidden
                    className={cn(
                      "mx-2 h-[2px] flex-1 rounded-full transition-colors duration-500",
                      state === "done"
                        ? "bg-cipher-mint/35"
                        : "bg-steel-border/25"
                    )}
                  />
                )}
              </div>

              <div className="mt-3 pe-4">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedStepId(step._id)}
                    className={cn(
                      "inline-flex items-center gap-1 self-start rounded-sm text-start text-body-sm leading-5 transition-colors",
                      "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      state === "current" ? "font-semibold text-glacier" :
                      state === "done" ? "font-medium text-moonlight/90" :
                      state === "failed" ? "font-medium text-rose-400" :
                      "font-medium text-fog/60"
                    )}
                    title={step.name}
                  >
                    <span className="truncate">{step.name || `مرحله ${faNum(i + 1)}`}</span>
                    <ChevronDown className={cn("size-4 shrink-0 text-fog/40 transition-transform", isSelected && "rotate-180")} />
                  </button>

                  <span className="text-caption text-fog/50">
                    {step.stepType ? (stepTypeLabel[step.stepType] || step.stepType) : "گام"}
                  </span>

                  {state === "current" && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-electric-iris/15 px-2 py-0.5 text-caption font-medium text-electric-iris ring-1 ring-inset ring-electric-iris/20">
                      مرحله جاری
                    </span>
                  )}
                  {state === "done" && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-cipher-mint/10 px-2 py-0.5 text-caption font-medium text-cipher-mint ring-1 ring-inset ring-cipher-mint/20">
                      تکمیل
                    </span>
                  )}
                  {state === "failed" && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-caption font-medium text-rose-400 ring-1 ring-inset ring-rose-500/20">
                      رد شده
                    </span>
                  )}
                </div>

                {approval?.decidedAt && (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-caption text-fog" title={formatDateTime(approval.decidedAt)}>
                    <Clock className="size-4 shrink-0 text-fog/60" />
                    <span dir="ltr">{new Date(approval.decidedAt).toLocaleDateString("fa-IR")}</span>
                  </p>
                )}
                {actorName && (
                  <p className="mt-1 inline-flex w-full items-center gap-1.5 text-caption text-pebble" title={actorName}>
                    <User className="size-4 shrink-0 text-fog/60" />
                    <span className="truncate">{actorName}</span>
                  </p>
                )}
                {state === "upcoming" && firstUnit && (
                  <p className="mt-2 inline-flex w-full items-center gap-1.5 text-caption text-fog/50" title={firstUnit.name}>
                    <Building2 className="size-4 shrink-0 text-fog/40" />
                    <span className="truncate">{firstUnit.name}</span>
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {/* ── Mobile vertical stepper ────────────────────────────────── */}
      <div className="relative lg:hidden">
        <div aria-hidden className="absolute start-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-frost-link/25 via-steel-border/25 to-transparent" />
        <ol className="space-y-0">
          {sortedSteps.map((step, i) => {
            const state = stateFor(step)
            const isSelected = selectedStepId === step._id
            const approval = approvalMap.get(step._id)
            const actorName = approval?.decidedBy ? fullName(approval.decidedBy) : undefined
            const stepUnits = stepResponsibleUnits?.[step._id] || []
            const firstUnit = stepUnits[0]

            return (
              <li key={step._id} className="relative flex items-start gap-4 pb-5 last:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedStepId(step._id)}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    state === "done" && "bg-cipher-mint/15 text-cipher-mint ring-1 ring-cipher-mint/30 shadow-[0_0_14px_rgba(38,150,132,0.22)]",
                    state === "current" && "bg-electric-iris/15 text-electric-iris ring-1 ring-electric-iris/40 shadow-[0_0_20px_rgba(102,58,243,0.4)]",
                    state === "upcoming" && "bg-white/[0.03] text-fog/50 ring-1 ring-steel-border/25",
                    state === "failed" && "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30"
                  )}
                >
                  {state === "done" ? (
                    <Check className="size-5" strokeWidth={2.5} />
                  ) : state === "current" ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : state === "failed" ? (
                    <X className="size-5" strokeWidth={2.5} />
                  ) : (
                    <span className="text-sm font-semibold">{faNum(i + 1)}</span>
                  )}
                </button>

                <div className="min-w-0 flex-1 pt-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStepId(step._id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-sm text-body-sm leading-5 transition-colors",
                        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        state === "current" ? "font-semibold text-glacier" :
                        state === "done" ? "font-medium text-moonlight/90" :
                        state === "failed" ? "font-medium text-rose-400" :
                        "font-medium text-fog/60"
                      )}
                    >
                      <span className="truncate">{step.name || `مرحله ${faNum(i + 1)}`}</span>
                      <ChevronDown className={cn("size-4 shrink-0 text-fog/40 transition-transform", isSelected && "rotate-180")} />
                    </button>
                    {state === "current" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-electric-iris/15 px-2 py-0.5 text-caption font-medium text-electric-iris ring-1 ring-inset ring-electric-iris/20">
                        مرحله جاری
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-caption text-fog/50">
                    {step.stepType ? (stepTypeLabel[step.stepType] || step.stepType) : "گام"}
                    {state === "done" ? " · تکمیل" : ""}
                    {state === "failed" ? " · رد شده" : ""}
                  </p>
                  {(actorName || approval?.decidedAt) && (
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-fog">
                      {actorName && (
                        <span className="inline-flex items-center gap-1.5">
                          <User className="size-4 text-fog/60" />
                          {actorName}
                        </span>
                      )}
                      {approval?.decidedAt && (
                        <span className="inline-flex items-center gap-1.5" dir="ltr">
                          <Clock className="size-4 text-fog/60" />
                          {new Date(approval.decidedAt).toLocaleDateString("fa-IR")}
                        </span>
                      )}
                    </p>
                  )}
                  {state === "upcoming" && firstUnit && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-caption text-fog/50">
                      <Building2 className="size-4 text-fog/40" />
                      <span className="truncate">{firstUnit.name}</span>
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* ── Selected step details panel ────────────────────────────── */}
      {selectedStep && <SelectedStepPanel step={selectedStep} state={stateFor(selectedStep)} approvals={approvals || []} stepResponsibleUnits={stepResponsibleUnits || {}} />}
    </div>
  )
}

function SelectedStepPanel({
  step,
  state,
  approvals,
  stepResponsibleUnits,
}: {
  step: ProcessStep
  state: StepState
  approvals: StepApproval[]
  stepResponsibleUnits: Record<string, ResponsibleUnit[]>
}) {
  const stepApprovals = approvals.filter((a) => a.processStep?._id === step._id)
  const stepUnits = stepResponsibleUnits[step._id] || []
  const hasMultipleGroups = (step.assigneeGroups || []).length > 1

  return (
    <div
      className={cn(
        "mt-6 rounded-2xl border p-4 sm:p-5 transition-colors",
        state === "current"
          ? "border-electric-iris/25 bg-electric-iris/[0.04] shadow-[inset_0_0_40px_rgba(102,58,243,0.06)]"
          : "border-steel-border/20 bg-white/[0.02]"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className={cn("text-subheading font-medium", state === "current" ? "text-glacier" : "text-moonlight")}>
          {step.name || "مرحله"}
        </p>
        {step.stepType && (
          <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-caption font-medium text-fog ring-1 ring-inset ring-steel-border/30">
            {stepTypeLabel[step.stepType] || step.stepType}
          </span>
        )}
        {state === "current" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-electric-iris/15 px-2.5 py-0.5 text-caption font-medium text-electric-iris ring-1 ring-inset ring-electric-iris/20">
            <Loader2 className="size-4 animate-spin" />
            در انتظار اقدام
          </span>
        )}
      </div>

      {hasMultipleGroups && step.groupsOperator && (
        <p className="mt-1.5 text-body-sm text-fog">
          گروه‌های این مرحله با منطق{" "}
          <span className="font-medium text-pebble">{step.groupsOperator === "AND" ? "«همه»" : "«یکی از»"}</span>{" "}
          ترکیب شده‌اند.
        </p>
      )}

      {step.description && (
        <div className="mt-3 rounded-xl border border-steel-border/20 bg-midnight-ink/30 p-3">
          <p className="flex items-center gap-1.5 text-caption font-medium text-fog">
            <MessageSquare className="size-4 text-fog/60" />
            توضیحات مرحله
          </p>
          <p className="mt-1.5 text-body-sm leading-7 text-moonlight/80 whitespace-pre-wrap">{step.description}</p>
        </div>
      )}

      {stepUnits.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-body-sm font-medium text-pebble">
            <Building2 className="size-4 text-fog/60" />
            مسئولان این مرحله
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {stepUnits.map((unit) => (
              <div
                key={unit._id}
                className="rounded-xl border border-steel-border/20 bg-white/[0.02] p-3"
              >
                <p className="text-body-sm font-medium text-moonlight">{unit.name || "—"}</p>
                {unit.head ? (
                  <div className="mt-1.5 space-y-1 text-caption text-fog">
                    <p className="flex items-center gap-1.5">
                      <User className="size-4 text-fog/60" />
                      {fullName(unit.head)}
                    </p>
                    {unit.head.position && (
                      <p className="flex items-center gap-1.5">
                        <Briefcase className="size-4 text-fog/50" />
                        {unit.head.position}
                      </p>
                    )}
                    {unit.head.roles && unit.head.roles.length > 0 && (
                      <p className="flex items-center gap-1.5">
                        <ShieldCheck className="size-4 text-fog/50" />
                        {unit.head.roles.map((r) => labelForRole(r.name)).filter(Boolean).join("، ")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-caption text-amber-400/80">
                    <Circle className="size-3.5" />
                    هیچ مسئولی برای این واحد تعیین نشده است
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {stepApprovals.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-1.5 text-body-sm font-medium text-pebble">
            <Clock className="size-4 text-fog/60" />
            سوابق تأیید این مرحله
          </p>
          <div className="space-y-2">
            {stepApprovals.map((sa) => {
              const approved = sa.status === "approved"
              const rejected = sa.status === "rejected"
              return (
                <div key={sa._id} className="rounded-xl border border-steel-border/20 bg-white/[0.02] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full ring-1 ring-inset",
                          approved && "bg-cipher-mint/10 text-cipher-mint ring-cipher-mint/25",
                          rejected && "bg-rose-500/10 text-rose-400 ring-rose-500/25",
                          !approved && !rejected && "bg-amber-500/10 text-amber-400 ring-amber-500/25"
                        )}
                      >
                        {approved ? (
                          <Check className="size-4" strokeWidth={2.5} />
                        ) : rejected ? (
                          <X className="size-4" strokeWidth={2.5} />
                        ) : (
                          <Clock className="size-4" />
                        )}
                      </span>
                      <div>
                        <p className="text-body-sm font-medium text-moonlight">
                          {sa.decidedBy ? fullName(sa.decidedBy) : sa.unit?.name || "—"}
                        </p>
                        {(sa.unit?.name || sa.decidedBy?.position) && (
                          <p className="text-caption text-fog">
                            {[sa.unit?.name, sa.decidedBy?.position].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-caption font-medium ring-1 ring-inset",
                        approved && "bg-cipher-mint/10 text-cipher-mint ring-cipher-mint/25",
                        rejected && "bg-rose-500/10 text-rose-400 ring-rose-500/25",
                        !approved && !rejected && "bg-amber-500/10 text-amber-400 ring-amber-500/25"
                      )}
                    >
                      {approved ? "تأیید شد" : rejected ? "رد شد" : "در انتظار"}
                    </span>
                  </div>
                  {sa.decidedAt && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-caption text-fog" dir="ltr">
                      <Clock className="size-4 text-fog/50" />
                      {formatDateTime(sa.decidedAt)}
                    </p>
                  )}
                  {sa.comment && (
                    <p className="mt-2 rounded-lg border border-steel-border/15 bg-midnight-ink/30 p-2.5 text-body-sm leading-6 text-moonlight/80">
                      «{sa.comment}»
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!stepApprovals.length && !stepUnits.length && state === "upcoming" && (
        <p className="mt-3 text-body-sm text-fog/60">این مرحله هنوز آغاز نشده است.</p>
      )}
    </div>
  )
}
