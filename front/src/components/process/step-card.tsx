"use client"

import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Filter,
  Pencil,
  Trash2,
  Users,
  Workflow,
  ArrowUp,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface StepCardStep {
  _id?: string
  name?: string
  description?: string
  stepType?: string
  order?: number
  required?: boolean
  groupsOperator?: string
  assigneeGroups?: { operator?: string; unitIds?: string[] }[]
}

export interface StepUnitData {
  _id: string
  name?: string
  type?: string
}

const stepTypeStyles: Record<string, { bg: string; border: string; text: string; label: string; icon: React.ReactNode }> = {
  Approval: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "تصویب", icon: <CheckCircle2 className="size-4" /> },
  Review: { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", label: "بررسی", icon: <FileText className="size-4" /> },
  Notification: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", label: "اطلاع‌رسانی", icon: <Filter className="size-4" /> },
  Action: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", label: "اقدام", icon: <Workflow className="size-4" /> },
  Delivery: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", label: "تحویل", icon: <ArrowUp className="size-4" /> },
  Receipt: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", label: "دریافت", icon: <Clock className="size-4" /> },
  Payment: { bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/30", text: "text-fuchsia-400", label: "پرداخت", icon: <Clock className="size-4" /> },
}

function getStepType(stepType?: string) {
  return stepTypeStyles[stepType || ""] || stepTypeStyles.Approval
}

interface StepCardProps {
  step: StepCardStep
  index: number
  unitsMap: Record<string, StepUnitData>
  isFirst: boolean
  isLast: boolean
  moving?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function StepCard({
  step,
  index,
  unitsMap,
  isFirst,
  isLast,
  moving,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: StepCardProps) {
  const type = getStepType(step.stepType)
  const assigneeGroups = step.assigneeGroups || []

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-semibold",
            "border-electric-iris/40 bg-electric-iris/15 text-electric-iris",
            "shadow-[0_0_20px_-4px_rgba(102,58,243,0.55),inset_0_0_12px_-4px_rgba(182,217,252,0.35)]"
          )}
        >
          {(index + 1).toLocaleString("fa-IR")}
        </span>
        {!isLast && (
          <span className="my-1 w-px flex-1 bg-gradient-to-b from-electric-iris/35 via-steel-border/25 to-transparent" aria-hidden="true" />
        )}
      </div>

      <div
        className={cn(
          "group min-w-0 flex-1 rounded-2xl border border-white/8 bg-graphite-plate/40 p-5 backdrop-blur-md",
          "shadow-[inset_0_0_0_1px_rgba(186,215,247,0.05),0_16px_32px_-20px_rgba(0,0,0,0.6)]",
          "transition-all duration-200 hover:border-frost-link/20 hover:bg-graphite-plate/60 hover:shadow-[inset_0_0_0_1px_rgba(186,215,247,0.1),0_0_24px_-8px_rgba(182,217,252,0.25),0_20px_40px_-20px_rgba(0,0,0,0.7)]"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-body font-semibold text-glacier">{step.name || "گام بدون نام"}</span>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]", type.bg, type.border, type.text)}>
            {type.icon}
            {type.label}
          </span>
          {step.required && (
            <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-400/80">
              ضروری
            </span>
          )}
        </div>

        {step.description && (
          <p className="mt-1.5 text-body-sm leading-relaxed text-fog/55">{step.description}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {assigneeGroups.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-steel-border/15 bg-white/[0.03] px-2 py-1 text-[11px] text-fog/50">
              <Users className="size-3.5 shrink-0" />
              بدون گروه تخصیص
            </span>
          ) : (
            assigneeGroups.map((group, gIdx) => {
              const names = (group.unitIds || [])
                .map((uid) => unitsMap[uid]?.name)
                .filter(Boolean)
              return (
                <span
                  key={gIdx}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-steel-border/15 bg-white/[0.03] px-2 py-1 text-[11px] text-fog/60"
                >
                  <Users className="size-3.5 shrink-0" />
                  <span className="text-[10px] text-fog/40">{group.operator === "AND" ? "همه:" : "یکی:"}</span>
                  <span className="font-medium text-fog/75">{names.length > 0 ? names.join("، ") : "—"}</span>
                </span>
              )
            })
          )}
          <span className="ms-auto inline-flex items-center gap-1.5 text-[11px] text-fog/40">
            <Filter className="size-3.5" />
            {step.groupsOperator === "AND" ? "همه گروه‌ها" : "یکی از گروه‌ها"}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-10 text-fog/60 hover:text-moonlight"
          disabled={isFirst || moving}
          onClick={onMoveUp}
          title="انتقال به بالا"
          aria-label={`انتقال گام ${index + 1} به بالا`}
        >
          <ChevronUp className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-10 text-fog/60 hover:text-moonlight"
          disabled={isLast || moving}
          onClick={onMoveDown}
          title="انتقال به پایین"
          aria-label={`انتقال گام ${index + 1} به پایین`}
        >
          <ChevronDown className="size-5" />
        </Button>
        <div className="my-1 h-px w-6 bg-white/[0.08]" aria-hidden="true" />
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-10 text-fog/60 hover:text-frost-link hover:bg-frost-link/5"
          onClick={onEdit}
          disabled={moving}
          title="ویرایش گام"
          aria-label={`ویرایش گام ${index + 1}`}
        >
          <Pencil className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-10 text-fog/60 hover:text-ember hover:bg-ember/5"
          onClick={onDelete}
          disabled={moving}
          title="حذف گام"
          aria-label={`حذف گام ${index + 1}`}
        >
          {moving ? <Loader2 className="size-5 animate-spin" /> : <Trash2 className="size-5" />}
        </Button>
      </div>
    </div>
  )
}

export { StepCard }
export type { StepCardProps }
