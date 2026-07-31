import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const statusStyles: Record<string, string> = {
  active: "bg-cipher-mint/10 text-cipher-mint border-cipher-mint/20",
  inactive: "bg-fog/10 text-fog border-fog/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-electric-iris/10 text-electric-iris border-electric-iris/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  draft: "bg-pebble/10 text-pebble border-pebble/20",
  submitted: "bg-azure/10 text-azure border-azure/20",
  completed: "bg-cipher-mint/10 text-cipher-mint border-cipher-mint/20",
  cancelled: "bg-fog/10 text-fog border-fog/20",
  in_progress: "bg-electric-iris/10 text-electric-iris border-electric-iris/25",
  pendingfinalization: "bg-violet-500/10 text-violet-400 border-violet-500/25",
  sent_to_finance: "bg-azure/10 text-azure border-azure/25",
  paid: "bg-cipher-mint/10 text-cipher-mint border-cipher-mint/25",
  open: "bg-azure/10 text-azure border-azure/25",
  closed: "bg-fog/10 text-fog border-fog/25",
  awarded: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  accepted: "bg-cipher-mint/10 text-cipher-mint border-cipher-mint/25",
  partially_rejected: "bg-amber-500/10 text-amber-400 border-amber-500/25",
}

const defaultLabels: Record<string, string> = {
  active: "فعال",
  inactive: "غیرفعال",
  pending: "در انتظار",
  approved: "تایید شده",
  rejected: "رد شده",
  draft: "پیش‌نویس",
  submitted: "ارسال شده",
  completed: "تکمیل شده",
  cancelled: "لغو شده",
  in_progress: "در حال انجام",
  pendingfinalization: "در انتظار نهایی‌سازی",
  sent_to_finance: "ارسال به امور مالی",
  paid: "پرداخت شده",
  open: "باز",
  closed: "بسته شده",
  awarded: "اعطا شده",
  accepted: "پذیرفته شده",
  partially_rejected: "رد جزئی",
}

interface StatusBadgeProps {
  status: string
  label?: string
  labelMap?: Record<string, string>
  size?: "sm" | "md" | "lg"
  className?: string
}

function StatusBadge({ status, label, labelMap, size = "md", className }: StatusBadgeProps) {
  const displayLabel = label || (labelMap?.[status.toLowerCase()]) || defaultLabels[status.toLowerCase()] || status
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md font-medium shadow-subtle",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-body-sm",
        size === "lg" && "h-auto px-3.5 py-1.5 text-body font-semibold shadow-sm",
        statusStyles[status.toLowerCase()] || "bg-graphite-plate text-fog border-steel-border",
        className
      )}
    >
      {displayLabel}
    </Badge>
  )
}

export { StatusBadge }
