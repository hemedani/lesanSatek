"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Workflow,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  ArrowUp,
  Filter,
  ZoomIn,
  ZoomOut,
  Scan,
  Plus,
  MousePointer2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { get as getUnit } from "@/app/actions/unit/get";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

interface Step {
  _id?: string;
  name?: string;
  description?: string;
  stepType?: string;
  order?: number;
  required?: boolean;
  groupsOperator?: string;
  assigneeGroups?: { operator?: string; unitIds?: string[] }[];
}

export interface ProcessData {
  _id?: string;
  name?: string;
  description?: string;
  status?: string;
  version?: number;
  isActive?: boolean;
  organization?: { _id?: string; name?: string };
  createdBy?: { _id?: string; first_name?: string; last_name?: string };
  steps?: Step[];
}

interface UnitData {
  _id: string;
  name: string;
  type?: string;
  head?: { first_name?: string; last_name?: string };
}

const stepTypeColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
  Approval: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", label: "تصویب" },
  Review: { bg: "bg-sky-500/10", border: "border-sky-500/30", text: "text-sky-400", label: "بررسی" },
  Notification: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", label: "اطلاع‌رسانی" },
  Action: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", label: "اقدام" },
  Delivery: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", label: "تحویل" },
  Receipt: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", label: "دریافت" },
  Payment: { bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/30", text: "text-fuchsia-400", label: "پرداخت" },
};

const stepTypeIcons: Record<string, React.ReactNode> = {
  Approval: <CheckCircle2 className="size-5" />,
  Review: <FileText className="size-5" />,
  Notification: <Filter className="size-5" />,
  Action: <Workflow className="size-5" />,
  Delivery: <ArrowUp className="size-5" />,
  Receipt: <Clock className="size-5" />,
  Payment: <Clock className="size-5" />,
};

function getStepColor(stepType?: string) {
  return stepTypeColors[stepType || ""] || stepTypeColors.Approval;
}

function FlowEdge({ active }: { active?: boolean }) {
  return (
    <div className="relative flex flex-col items-center py-1">
      <svg width="28" height="40" viewBox="0 0 28 40" className="overflow-visible">
        <path
          d="M14 0 C 14 14, 14 22, 14 30"
          fill="none"
          stroke={active ? "#663af3" : "#3f4959"}
          strokeWidth="1.5"
          strokeDasharray="5 5"
          strokeLinecap="round"
          className={cn("animate-blueprint-dash", active && "drop-shadow-[0_0_6px_rgba(102,58,243,0.65)]")}
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
  );
}

function AssigneeGroupBadge({ operator, unitNames }: { operator?: string; unitNames: string[] }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-steel-border/15 bg-white/[0.03] px-2 py-1 text-[11px] text-fog/60">
      <Users className="size-3.5 shrink-0" />
      <span className="text-[10px] text-fog/40 ms-0.5">
        {operator === "AND" ? "همه:" : "یکی:"}
      </span>
      <span className="font-medium text-fog/70">
        {unitNames.length > 0 ? unitNames.join("، ") : "—"}
      </span>
    </div>
  );
}

interface StepNodeProps {
  step: Step;
  index: number;
  totalSteps: number;
  unitsMap: Record<string, UnitData>;
  selected: boolean;
  onSelect?: () => void;
}

function StepNode({ step, index, totalSteps, unitsMap, selected, onSelect }: StepNodeProps) {
  const colors = getStepColor(step.stepType);

  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`ویرایش گام ${index + 1}: ${step.name || "بدون نام"}`}
        className={cn(
          "group relative w-full max-w-xl rounded-2xl border p-5 text-start backdrop-blur-sm transition-all duration-200",
          colors.border,
          colors.bg,
          selected
            ? "glass-card-active border-transparent shadow-[0_0_40px_-8px_rgba(102,58,243,0.45),0_24px_48px_-16px_rgba(0,0,0,0.6)]"
            : "glass-card-hover-active hover:scale-[1.015]"
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl border",
              colors.bg,
              colors.border,
              colors.text
            )}
          >
            {stepTypeIcons[step.stepType || ""]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-glacier">{step.name || "—"}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]",
                  colors.bg,
                  colors.text,
                  colors.border
                )}
              >
                {stepTypeIcons[step.stepType || ""]}
                <span className="text-current">{getStepColor(step.stepType).label}</span>
              </span>
              {step.required && (
                <span className="text-[11px] font-medium text-amber-400/70">ضروری</span>
              )}
            </div>
            {step.description && (
              <p className="mt-1.5 text-sm leading-relaxed text-fog/50">{step.description}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {(step.assigneeGroups || []).map((group, gIdx) => {
                const unitNames = (group.unitIds || [])
                  .map((uid) => unitsMap[uid]?.name)
                  .filter(Boolean) as string[];
                return (
                  <AssigneeGroupBadge
                    key={gIdx}
                    operator={group.operator}
                    unitNames={unitNames}
                  />
                );
              })}
              {(step.assigneeGroups || []).length === 0 && (
                <AssigneeGroupBadge unitNames={[]} />
              )}
            </div>

            <div className="mt-3 flex items-center gap-3 border-t border-steel-border/10 pt-2">
              <div className="flex items-center gap-1.5 text-[10px] text-fog/40">
                <Filter className="size-3.5" />
                <span>{step.groupsOperator === "AND" ? "همه گروه‌ها" : "یکی از گروه‌ها"}</span>
              </div>
              <span className="text-[10px] text-fog/30">•</span>
              <span className="text-[10px] text-fog/40">
                {(step.assigneeGroups || []).reduce((sum, g) => sum + (g.unitIds?.length || 0), 0)} واحد
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span className="flex size-7 items-center justify-center rounded-full bg-black/20 font-mono text-xs font-semibold text-fog/60 ring-1 ring-inset ring-white/[0.06]">
              {index + 1}
            </span>
            {onSelect && (
              <span className="flex size-9 items-center justify-center rounded-lg text-fog/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[pressed=true]:opacity-100">
                <MousePointer2 className="size-4.5" />
              </span>
            )}
          </div>
        </div>
      </button>

      {index < totalSteps - 1 && <FlowEdge active={selected} />}
    </div>
  );
}

interface ProcessGraphProps {
  process: ProcessData;
  onNodeSelect?: (step: Step) => void;
  selectedStepId?: string | null;
  onAddStep?: () => void;
  adding?: boolean;
}

export function ProcessGraph({
  process,
  onNodeSelect,
  selectedStepId,
  onAddStep,
  adding,
}: ProcessGraphProps) {
  const [unitsMap, setUnitsMap] = useState<Record<string, UnitData>>({});
  const [zoom, setZoom] = useState(1);

  const steps = useMemo(
    () => (process.steps || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)),
    [process.steps]
  );

  const unitIds = useMemo(() => {
    const ids = new Set<string>();
    for (const step of steps) {
      for (const group of step.assigneeGroups || []) {
        for (const uid of group.unitIds || []) {
          if (uid) ids.add(uid);
        }
      }
    }
    return Array.from(ids);
  }, [steps]);

  useEffect(() => {
    if (unitIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled(
        unitIds.map((uid) =>
          getUnit(
            { activeRoleId: getActiveRoleIdFromStore(), _id: uid },
            { _id: 1, name: 1, type: 1, head: { first_name: 1, last_name: 1 } }
          )
        )
      );
      if (cancelled) return;
      const map: Record<string, UnitData> = {};
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.success && result.value.body?.[0]) {
          const unit = result.value.body[0];
          map[unit._id] = unit;
        }
      }
      setUnitsMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [unitIds]);

  const zoomIn = () => setZoom((z) => Math.min(1.4, z + 0.1));
  const zoomOut = () => setZoom((z) => Math.max(0.7, z - 0.1));
  const fitToScreen = () => setZoom(1);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-blueprint-grid-clear shadow-[inset_0_0_80px_-24px_rgba(186,207,247,0.12),0_24px_48px_-24px_rgba(0,0,0,0.7)]">
      <div className="blueprint-glow pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative h-[560px] overflow-auto sm:h-[620px]">
        <div
          className="flex min-h-full flex-col items-center px-6 py-10"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {steps.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-white/[0.02] ring-1 ring-inset ring-white/[0.06]">
                <Workflow className="size-8 text-fog/30" />
              </div>
              <div>
                <p className="text-sm text-fog/50">هیچ گامی برای این فرآیند تعریف نشده است</p>
                {onAddStep && (
                  <p className="mt-1 text-xs text-fog/40">
                    اولین گام گردش کار را اضافه کنید تا در اینجا نمایش داده شود.
                  </p>
                )}
              </div>
              {onAddStep && (
                <Button type="button" variant="outline" className="gap-2 px-4" onClick={onAddStep} disabled={adding}>
                  {adding ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
                  افزودن اولین گام
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full max-w-xl space-y-0">
              {steps.map((step, index) => (
                <StepNode
                  key={step._id || index}
                  step={step}
                  index={index}
                  totalSteps={steps.length}
                  unitsMap={unitsMap}
                  selected={!!selectedStepId && selectedStepId === step._id}
                  onSelect={onNodeSelect ? () => onNodeSelect(step) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 end-4 z-10 flex items-center gap-1 rounded-xl border border-white/8 bg-graphite-plate/80 p-1.5 shadow-[0_0_0_1px_rgba(186,215,247,0.08)_inset,0_12px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-10 text-fog/70 hover:text-moonlight"
          onClick={zoomIn}
          title="بزرگ‌نمایی"
          aria-label="بزرگ‌نمایی"
        >
          <ZoomIn className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-10 text-fog/70 hover:text-moonlight"
          onClick={zoomOut}
          title="کوچک‌نمایی"
          aria-label="کوچک‌نمایی"
        >
          <ZoomOut className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-10 text-fog/70 hover:text-moonlight"
          onClick={fitToScreen}
          title="تناسب با صفحه"
          aria-label="تناسب با صفحه"
        >
          <Scan className="size-5" />
        </Button>
        {onAddStep && (
          <>
            <div className="mx-1 h-6 w-px bg-white/[0.08]" aria-hidden="true" />
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="size-10 text-electric-iris hover:bg-electric-iris/10 hover:text-electric-iris"
              onClick={onAddStep}
              title="افزودن گام"
              aria-label="افزودن گام"
              disabled={adding}
            >
              {adding ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
