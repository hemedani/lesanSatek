import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SectionCardProps {
  icon: React.ElementType
  iconClassName?: string
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

function SectionCard({ icon: Icon, iconClassName, title, description, children, className }: SectionCardProps) {
  return (
    <Card variant="glass" className={cn("w-full [--card-spacing:--spacing(6)]", className)}>
      <CardHeader className="pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20",
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <div>
            <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
            {description && (
              <p className="mt-1 text-body-sm text-fog/70 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

export { SectionCard }
