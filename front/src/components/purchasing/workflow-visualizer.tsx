import { Check, Circle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessStep {
  _id: string;
  name?: string;
  order?: number;
}

interface WorkflowVisualizerProps {
  steps: ProcessStep[];
  currentStep: number;
  status?: string;
}

export function WorkflowVisualizer({ steps, currentStep, status }: WorkflowVisualizerProps) {
  const isComplete = status === "Completed";
  const isRejected = status === "Rejected" || status === "Cancelled";
  const sortedSteps = [...steps].sort((a, b) => (a.order || 0) - (b.order || 0));

  if (!sortedSteps.length) {
    return (
      <p className="text-sm text-fog/50 text-center py-6">هیچ مرحله‌ای برای این فرآیند تعریف نشده است.</p>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line connector */}
      <div className="absolute start-[17px] top-8 bottom-8 w-px bg-steel-border/20" />

      <div className="space-y-0">
        {sortedSteps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isPast = stepNumber < currentStep || isComplete;
          const isFailed = isRejected && isActive;

          return (
            <div key={step._id} className="flex items-start gap-4 pb-6 last:pb-0 relative">
              {/* Step indicator */}
              <div
                className={cn(
                  "size-[34px] rounded-full flex items-center justify-center shrink-0 relative z-[1] transition-all duration-300",
                  isPast && !isComplete && status !== "Rejected" && status !== "Cancelled"
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

              {/* Step content */}
              <div className="min-w-0 flex-1 pt-1.5">
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
                {isActive && !isComplete && !isRejected && (
                  <p className="text-xs text-electric-iris/70 mt-0.5">در انتظار اقدام</p>
                )}
                {isComplete && stepNumber === sortedSteps.length && (
                  <p className="text-xs text-emerald-400/70 mt-0.5">تکمیل شده</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
