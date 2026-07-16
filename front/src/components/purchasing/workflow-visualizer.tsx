"use client"

import { useState } from "react"
import { Check, Circle, X, Loader2, User, Clock, ChevronDown, ChevronUp, Building2, Briefcase, ShieldCheck } from "lucide-react"
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

export function WorkflowVisualizer({
  steps,
  currentStepIndex = 0,
  status,
  approvals,
  stepResponsibleUnits,
}: WorkflowVisualizerProps) {
  const s = (status || "").toLowerCase()
  const isComplete = s === "completed" || s === "approved"
  const isRejected = s === "rejected" || s === "cancelled"
  const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0))

  const activeStep = sortedSteps.find((st) => st.order === currentStepIndex) || sortedSteps[currentStepIndex] || null
  const activeStepId = activeStep?._id ?? null

  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    const _activeStep = sortedSteps.find((st) => st.order === currentStepIndex) || sortedSteps[currentStepIndex] || null
    if (_activeStep?._id) initial.add(_activeStep._id)
    return initial
  })

  const approvalMap = new Map<string, StepApproval>()
  if (approvals) {
    for (const a of approvals) {
      const stepId = a.processStep?._id
      if (stepId) approvalMap.set(stepId, a)
    }
  }

  const activeStepUnits = activeStepId ? stepResponsibleUnits?.[activeStepId] || [] : []

  const toggleNotes = (stepId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  if (!sortedSteps.length) {
    return (
      <p className="text-sm text-fog/50 text-center py-6">هیچ مرحله‌ای برای این فرآیند تعریف نشده است.</p>
    )
  }

  return (
    <div className="rounded-xl border border-steel-border/15 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
          <Clock className="size-4 text-electric-iris" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-moonlight">گردش کار</h3>
          <p className="text-[11px] text-fog/40">{sortedSteps.length} مرحله</p>
        </div>
      </div>

      {activeStep && !isComplete && !isRejected && activeStepUnits.length > 0 && (
        <div className="mb-5 p-3 rounded-lg bg-electric-iris/[0.06] border border-electric-iris/15">
          <div className="flex items-center gap-2 text-xs text-fog/60 mb-1.5">
            <Loader2 className="size-3.5 animate-spin text-electric-iris" />
            <span>مرحله جاری:</span>
            <span className="text-frost-link font-medium">{activeStep.name || `مرحله ${activeStep.order || "—"}`}</span>
          </div>
          <div className="text-xs text-fog/80 space-y-1">
            {activeStepUnits.map((unit) => (
              <div key={unit._id} className="flex items-center gap-1.5">
                <User className="size-3 text-electric-iris/60" />
                <span>
                  {unit.head
                    ? `${unit.head.first_name || ""} ${unit.head.last_name || ""}${unit.head.position ? ` · ${unit.head.position}` : ""}`
                    : `${unit.name}: مسئولی تعیین نشده`
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute start-[17px] top-8 bottom-8 w-px bg-steel-border/20" />

        <div className="space-y-0">
          {sortedSteps.map((step, index) => {
            const stepNumber = index + 1
            const isActive = step._id === activeStepId
            const stepIdx = step._id ? sortedSteps.findIndex((s) => s._id === step._id) : index
            const activeIdx = activeStepId ? sortedSteps.findIndex((s) => s._id === activeStepId) : -1
            const isPast = stepIdx < activeIdx || isComplete
            const isFailed = isRejected && isActive

            const approval = approvalMap.get(step._id)
            const hasNotes = !!step.description
            const notesOpen = expandedNotes.has(step._id)

            const stepApprovals = approvals?.filter((a) => a.processStep?._id === step._id) || []
            const stepUnits = stepResponsibleUnits?.[step._id] || []

            return (
              <div key={step._id} className="pb-5 last:pb-0 relative">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "size-[34px] rounded-full flex items-center justify-center shrink-0 relative z-[1] transition-all duration-300",
                      isPast && !isComplete && !isRejected
                        ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
                        : isComplete
                          ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
                          : isFailed
                            ? "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20"
                            : isActive
                              ? "bg-electric-iris/15 text-electric-iris ring-1 ring-electric-iris/30 shadow-[0_0_12px_rgba(102,58,243,0.2)]"
                              : "bg-white/[0.03] text-fog/30 ring-1 ring-steel-border/20"
                    )}
                  >
                    {isComplete ? (
                      <Check className="size-4" />
                    ) : isPast ? (
                      <Check className="size-4" />
                    ) : isFailed ? (
                      <X className="size-4" />
                    ) : isActive ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Circle className="size-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pt-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium leading-5 transition-colors duration-200",
                          isActive
                            ? "text-frost-link"
                            : isPast || isComplete
                              ? "text-moonlight/70"
                              : "text-fog/40"
                        )}
                      >
                        {step.name || `مرحله ${stepNumber}`}
                      </p>
                      {approval?.status && (
                        <span
                          className={cn(
                            "text-[11px] px-2 py-0.5 rounded-full font-medium",
                            approval.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : approval.status === "rejected"
                                ? "bg-rose-500/10 text-rose-400"
                                : "bg-amber-500/10 text-amber-400"
                          )}
                        >
                          {approval.status === "approved" ? "تأیید" : approval.status === "rejected" ? "رد" : "در انتظار"}
                        </span>
                      )}
                    </div>

                    {step.stepType && (
                      <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-xs bg-white/[0.03] text-fog/40 mt-0.5">
                        {stepTypeLabel[step.stepType] || step.stepType}
                      </span>
                    )}

                    {hasNotes && (
                      <div className="mt-1.5">
                        <button
                          onClick={() => toggleNotes(step._id)}
                          className="flex items-center gap-1 text-[11px] text-fog/50 hover:text-fog/70 transition-colors"
                        >
                          {notesOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          {notesOpen ? "بستن توضیحات" : "مشاهده توضیحات"}
                        </button>
                        {notesOpen && (
                          <div className="mt-1.5 text-xs text-fog/60 bg-white/[0.02] rounded-lg p-3 border border-steel-border/10 whitespace-pre-wrap leading-6">
                            {step.description}
                          </div>
                        )}
                      </div>
                    )}

                    {stepApprovals.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {stepApprovals.map((sa) => (
                          <div key={sa._id} className="flex items-start gap-2 text-xs">
                            <div className="flex flex-col gap-0.5">
                              {sa.unit?.name && (
                                <span className="text-fog/50">{sa.unit.name}</span>
                              )}
                              {sa.decidedBy && (
                                <span className="text-fog/60 flex items-center gap-1">
                                  <User className="size-3" />
                                  {sa.decidedBy.first_name || ""} {sa.decidedBy.last_name || ""}
                                  {sa.decidedBy.position && (
                                    <span className="text-fog/40">· {sa.decidedBy.position}</span>
                                  )}
                                  {sa.decidedBy.roles?.[0]?.name && (
                                    <span className="text-fog/40">· {labelForRole(sa.decidedBy.roles[0].name)}</span>
                                  )}
                                </span>
                              )}
                              {sa.decidedAt && (
                                <span className="text-fog/30 flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {new Date(sa.decidedAt).toLocaleDateString("fa-IR")}
                                  {" "}
                                  {new Date(sa.decidedAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                              {sa.comment && (
                                <span className="text-fog/40 italic mt-0.5">"{sa.comment}"</span>
                              )}
                              {sa.status && (
                                <span
                                  className={cn(
                                    "inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-0.5 w-fit",
                                    sa.status === "approved"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : sa.status === "rejected"
                                        ? "bg-rose-500/10 text-rose-400"
                                        : "bg-amber-500/10 text-amber-400"
                                  )}
                                >
                                  {sa.status === "approved" ? "تأیید" : sa.status === "rejected" ? "رد" : "در انتظار"}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {stepUnits.length > 0 && (
                      <div className={cn("mt-2", isActive && "mt-3")}>
                        {isActive || isPast ? (
                          <>
                            {isActive && (
                              <p className="text-[11px] text-electric-iris/70 font-medium mb-1.5">مسئولان این مرحله:</p>
                            )}
                            {step.groupsOperator && step.assigneeGroups && step.assigneeGroups.length > 1 && isActive && (
                              <p className="text-[10px] text-fog/40 mb-1.5">
                                گروه‌ها با منطق {step.groupsOperator === "AND" ? "«همه»" : "«یکی از»"} ترکیب شده‌اند
                              </p>
                            )}
                            {stepUnits.map((unit) => (
                              <div
                                key={unit._id}
                                className={cn(
                                  "mb-1.5 last:mb-0",
                                  isActive
                                    ? "rounded-lg bg-electric-iris/[0.04] border border-electric-iris/10 p-3 space-y-1.5"
                                    : ""
                                )}
                              >
                                {isActive ? (
                                  <>
                                    <div className="flex items-center gap-1.5 text-xs text-frost-link font-medium">
                                      <Building2 className="size-3.5" />
                                      {unit.name || "—"}
                                    </div>
                                    {unit.head && (
                                      <div className="space-y-1 text-xs">
                                        <div className="flex items-center gap-1.5 text-fog/60">
                                          <User className="size-3" />
                                          {unit.head.first_name || ""} {unit.head.last_name || ""}
                                        </div>
                                        {unit.head.position && (
                                          <div className="flex items-center gap-1.5 text-fog/50">
                                            <Briefcase className="size-3" />
                                            {unit.head.position}
                                          </div>
                                        )}
                                        {unit.head.roles && unit.head.roles.length > 0 && (
                                          <div className="flex items-center gap-1.5 text-fog/50">
                                            <ShieldCheck className="size-3" />
                                            {unit.head.roles.map((r) => labelForRole(r.name)).filter(Boolean).join("، ")}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {!unit.head && (
                                      <p className="text-xs text-amber-400/70">هیچ مسئولی برای این واحد تعیین نشده است</p>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-xs text-fog/40">
                                    <Building2 className="size-3 shrink-0" />
                                    <span className="truncate max-w-[120px]">{unit.name}</span>
                                    {unit.head && (
                                      <span className="text-fog/30 truncate max-w-[200px]">
                                        · {unit.head.first_name || ""} {unit.head.last_name || ""}
                                        {unit.head.position ? ` · ${unit.head.position}` : ""}
                                      </span>
                                    )}
                                    {!unit.head && (
                                      <span className="text-amber-400/50">· بدون مسئول</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                            {stepUnits.map((unit) => (
                              <span key={unit._id} className="inline-flex items-center gap-1 text-fog/40">
                                <Building2 className="size-3 shrink-0" />
                                <span className="truncate max-w-[120px]">{unit.name}</span>
                                {unit.head && (
                                  <span className="text-fog/30 truncate max-w-[200px]">
                                    · {unit.head.first_name || ""} {unit.head.last_name || ""}
                                    {unit.head.position ? ` · ${unit.head.position}` : ""}
                                  </span>
                                )}
                                {!unit.head && (
                                  <span className="text-amber-400/50">· بدون مسئول</span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {!approval && isActive && !isComplete && !isRejected && stepUnits.length === 0 && (
                      <p className="text-xs text-electric-iris/70 mt-0.5">در انتظار اقدام</p>
                    )}
                    {isComplete && stepNumber === sortedSteps.length && (
                      <p className="text-xs text-emerald-400/70 mt-0.5">تکمیل شده</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
