"use client";

import { useEffect, useState, useCallback } from "react";
import { Workflow, CheckCircle2, Clock, FileText, Users, ArrowUp, Filter } from "lucide-react";
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

interface ProcessData {
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
  Approval: <CheckCircle2 className="size-4" />,
  Review: <FileText className="size-4" />,
  Notification: <Filter className="size-4" />,
  Action: <Workflow className="size-4" />,
  Delivery: <ArrowUp className="size-4" />,
  Receipt: <Clock className="size-4" />,
  Payment: <Clock className="size-4" />,
};

function getStepColor(stepType?: string) {
  return stepTypeColors[stepType || ""] || stepTypeColors.Approval;
}

function AssigneeGroupBadge({ operator, unitNames }: { operator?: string; unitNames: string[] }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] border border-steel-border/15 text-[11px] text-fog/60">
      <Users className="size-3 shrink-0" />
      <span className="text-[10px] text-fog/40 ms-0.5">
        {operator === "AND" ? "همه:" : "یکی:"}
      </span>
      <span className="text-fog/70 font-medium">
        {unitNames.length > 0 ? unitNames.join("، ") : "—"}
      </span>
    </div>
  );
}

function StepNode({
  step,
  index,
  totalSteps,
  unitsMap,
}: {
  step: Step;
  index: number;
  totalSteps: number;
  unitsMap: Record<string, UnitData>;
}) {
  const colors = getStepColor(step.stepType);

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`relative w-full max-w-xl rounded-2xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-5 transition-all duration-200 hover:scale-[1.02]`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex items-center justify-center size-10 rounded-xl ${colors.bg} border ${colors.border} shrink-0`}
          >
            <span className={`text-base font-bold ${colors.text}`}>{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-semibold text-glacier">{step.name || "—"}</span>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${colors.bg} ${colors.text} border ${colors.border}`}>
                {stepTypeIcons[step.stepType || ""]}
                <span>{getStepColor(step.stepType).label}</span>
              </div>
              {step.required && (
                <span className="text-[10px] text-amber-400/70 font-medium">ضروری</span>
              )}
            </div>
            {step.description && (
              <p className="text-sm text-fog/50 mt-1.5 leading-relaxed">{step.description}</p>
            )}

            <div className="mt-3 space-y-2">
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

            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-steel-border/10">
              <div className="flex items-center gap-1.5 text-[10px] text-fog/40">
                <Filter className="size-3" />
                <span>{step.groupsOperator === "AND" ? "همه گروه‌ها" : "یکی از گروه‌ها"}</span>
              </div>
              <span className="text-[10px] text-fog/30">•</span>
              <span className="text-[10px] text-fog/40">
                {(step.assigneeGroups || []).reduce((sum, g) => sum + (g.unitIds?.length || 0), 0)} واحد
              </span>
            </div>
          </div>
        </div>
      </div>

      {index < totalSteps - 1 && (
        <div className="flex flex-col items-center py-2">
          <svg width="24" height="32" viewBox="0 0 24 32" className="text-steel-border/40">
            <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
            <polygon points="12,28 8,20 16,20" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function ProcessGraph({ process }: { process: ProcessData }) {
  const [unitsMap, setUnitsMap] = useState<Record<string, UnitData>>({});
  const steps = (process.steps || []).sort((a, b) => (a.order || 0) - (b.order || 0));

  const fetchUnits = useCallback(async () => {
    const unitIds = new Set<string>();
    for (const step of steps) {
      for (const group of step.assigneeGroups || []) {
        for (const uid of group.unitIds || []) {
          if (uid) unitIds.add(uid);
        }
      }
    }

    if (unitIds.size === 0) return;

    const results = await Promise.allSettled(
      Array.from(unitIds).map((uid) =>
        getUnit(
          { activeRoleId: getActiveRoleIdFromStore(), _id: uid },
          { _id: 1, name: 1, type: 1, head: { first_name: 1, last_name: 1 } }
        )
      )
    );

    const map: Record<string, UnitData> = {};
    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success && result.value.body?.[0]) {
        const unit = result.value.body[0];
        map[unit._id] = unit;
      }
    }
    setUnitsMap(map);
  }, [steps]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-electric-iris/20 bg-electric-iris/5 backdrop-blur-sm p-6">
        <div className="flex items-start gap-4">
          <div className="size-14 rounded-2xl bg-electric-iris/10 border border-electric-iris/20 flex items-center justify-center shrink-0">
            <Workflow className="size-7 text-electric-iris" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-glacier">{process.name || "بدون نام"}</h1>
            {process.description && (
              <p className="text-sm text-fog/50 mt-1">{process.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {process.status && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  process.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                  process.status === "Archived" ? "bg-fog/5 text-fog/60 border-steel-border/20" :
                  "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}>
                  {process.status === "Draft" ? "پیش‌نویس" : process.status === "Active" ? "فعال" : "بایگانی"}
                </span>
              )}
              <span className="text-xs text-fog/50 font-mono">v{process.version || 1}</span>
              {process.organization && (
                <span className="text-xs text-fog/50">{process.organization.name}</span>
              )}
              {process.createdBy && (
                <span className="text-xs text-fog/40">
                  ایجاد توسط: {process.createdBy.first_name} {process.createdBy.last_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {steps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-steel-border/20 p-12 text-center">
          <Workflow className="size-12 text-fog/20 mx-auto mb-3" />
          <p className="text-sm text-fog/50">هیچ گامی برای این فرآیند تعریف نشده است</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <Workflow className="size-4 text-electric-iris" />
            <span className="text-sm text-fog/50">دنباله گام‌های فرآیند</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-electric-iris/8 text-electric-iris/70">
              {steps.length} گام
            </span>
          </div>
          <div className="space-y-0 w-full max-w-xl">
            {steps.map((step, index) => (
              <StepNode
                key={step._id || index}
                step={step}
                index={index}
                totalSteps={steps.length}
                unitsMap={unitsMap}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
