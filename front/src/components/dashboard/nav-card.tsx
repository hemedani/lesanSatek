import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NavCardProps {
  href: string
  title: string
  description?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  value?: string | number
  footerLabel?: string
  className?: string
}

function NavCard({
  href,
  title,
  description,
  icon: Icon,
  iconColor = "text-electric-iris",
  iconBg = "bg-electric-iris/10",
  value,
  footerLabel = "مشاهده جزئیات",
  className,
}: NavCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group/nav block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <Card
        variant="glass"
        className="h-full cursor-pointer [--card-spacing:--spacing(5)] transition-all duration-200 hover:-translate-y-0.5 hover:border-frost-link/35 hover:shadow-[0_12px_32px_-16px_rgba(182,217,252,0.35)] motion-reduce:hover:translate-y-0"
      >
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-[0_0_18px_-6px_rgba(182,217,252,0.4)] ring-1 ring-inset ring-white/[0.08]",
                iconBg
              )}
            >
              <Icon className={cn("size-5", iconColor)} />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-body-sm font-medium text-moonlight leading-6 transition-colors duration-200 group-hover/nav:text-frost-link">
                {title}
              </CardTitle>
              {description && (
                <p className="mt-0.5 truncate text-caption text-fog/60 leading-5">{description}</p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {value != null ? (
            <p className="text-2xl font-semibold tabular-nums text-glacier leading-8">
              {typeof value === "number" ? value.toLocaleString("fa-IR") : value}
            </p>
          ) : (
            <div className="h-2" />
          )}
          <p className="mt-1.5 text-caption text-fog/40 transition-colors duration-200 group-hover/nav:text-frost-link/80">
            {footerLabel}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

export { NavCard }
export type { NavCardProps }
