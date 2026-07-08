import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  Draft: { label: "پیش‌نویس", className: "bg-white/5 text-fog/70 border-steel-border/40" },
  Pending: { label: "در انتظار بررسی", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  InProgress: { label: "در حال انجام", className: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  Approved: { label: "تأیید شده", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  Rejected: { label: "رد شده", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  Completed: { label: "تکمیل شده", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  Cancelled: { label: "لغو شده", className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

export function RequestStatusBadge({ status }: { status?: string }) {
  const config = statusConfig[status || ""] || statusConfig.Draft;
  return (
    <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5 font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
