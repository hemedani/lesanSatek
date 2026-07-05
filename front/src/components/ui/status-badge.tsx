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
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-medium shadow-subtle",
        statusStyles[status] || "bg-graphite-plate text-fog border-steel-border",
        className
      )}
    >
      {label || status}
    </Badge>
  )
}

export { StatusBadge }
