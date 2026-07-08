import { Check, X, Clock, Send, RotateCcw, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  action?: string;
  performed?: {
    by?: string;
    name?: string;
    at?: string;
  };
}

interface HistoryTimelineProps {
  history: HistoryEntry[];
}

function getActionIcon(action?: string) {
  switch (action) {
    case "Approved":
      return Check;
    case "Rejected":
      return X;
    case "Submitted":
    case "Submit":
      return Send;
    case "Updated":
    case "Update":
      return RotateCcw;
    case "Created":
    case "Add":
      return Clock;
    default:
      return Circle;
  }
}

function getActionColor(action?: string) {
  switch (action) {
    case "Approved":
      return "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20";
    case "Rejected":
      return "bg-rose-500/15 text-rose-400 ring-rose-500/20";
    case "Submitted":
    case "Submit":
      return "bg-sky-500/15 text-sky-400 ring-sky-500/20";
    default:
      return "bg-white/[0.03] text-fog/40 ring-steel-border/20";
  }
}

function getActionTitle(action?: string) {
  switch (action) {
    case "Approved":
      return "تأیید شده";
    case "Rejected":
      return "رد شده";
    case "Submitted":
    case "Submit":
      return "ارسال شده";
    case "Updated":
    case "Update":
      return "به‌روزرسانی";
    case "Created":
    case "Add":
      return "ایجاد شده";
    default:
      return action || "اقدام";
  }
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-fog/50 text-center py-6">تاریخچه‌ای ثبت نشده است.</p>
    );
  }

  const sorted = [...history].filter(h => h.performed?.at).sort(
    (a, b) => new Date(b.performed!.at!).getTime() - new Date(a.performed!.at!).getTime()
  );

  return (
    <div className="relative">
      <div className="absolute start-[17px] top-0 bottom-0 w-px bg-steel-border/20" />
      <div className="space-y-0">
        {sorted.map((entry, index) => {
          const Icon = getActionIcon(entry.action);
          const colorClass = getActionColor(entry.action);
          const title = getActionTitle(entry.action);

          return (
            <div key={index} className="flex items-start gap-4 pb-5 last:pb-0 relative">
              <div
                className={cn(
                  "size-[34px] rounded-full flex items-center justify-center shrink-0 relative z-[1] ring-1",
                  colorClass
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1 pt-1.5">
                <p className="text-sm font-medium text-moonlight">{title}</p>
                {entry.performed?.name && (
                  <p className="text-xs text-fog/50 mt-0.5">{entry.performed.name}</p>
                )}
                {entry.performed?.at && (
                  <p className="text-xs text-fog/40 mt-0.5" dir="ltr">
                    {new Date(entry.performed.at).toLocaleDateString("fa-IR")}
                    {" — "}
                    {new Date(entry.performed.at).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
