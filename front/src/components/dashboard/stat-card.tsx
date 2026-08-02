import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  subtitle?: string
  active?: boolean
  onClick?: () => void
  className?: string
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-electric-iris",
  iconBg = "bg-electric-iris/10",
  subtitle,
  active,
  onClick,
  className,
}: StatCardProps) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      {...(onClick ? { type: "button", onClick } : {})}
      className={cn(
        "block w-full rounded-xl text-start outline-none",
        onClick &&
          "cursor-pointer transition-transform duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
        className
      )}
    >
      <Card
        variant="glass"
        className={cn(
          "h-full [--card-spacing:--spacing(5)] transition-all duration-200",
          onClick && "hover:border-frost-link/40 hover:shadow-[0_0_28px_-10px_rgba(182,217,252,0.4)]",
          active && "border-frost-link/50 ring-1 ring-frost-link/25"
        )}
      >
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2.5">
              <p className="truncate text-body-sm font-medium text-fog/80 leading-6">{label}</p>
              <p className="text-2xl font-semibold tabular-nums text-glacier leading-9">
                {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
              </p>
              {subtitle && <p className="text-caption text-fog/55 leading-5">{subtitle}</p>}
            </div>
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-[0_0_18px_-6px_rgba(182,217,252,0.4)] ring-1 ring-inset ring-white/[0.08]",
                iconBg
              )}
            >
              <Icon className={cn("size-5", iconColor)} />
            </div>
          </div>
          <div className="mt-5 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
        </CardContent>
      </Card>
    </Comp>
  )
}

export { StatCard }
export type { StatCardProps }
