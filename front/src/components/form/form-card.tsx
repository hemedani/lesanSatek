import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FormCardProps extends React.ComponentProps<typeof Card> {
  title: string
  description?: string
  icon?: LucideIcon
  iconClassName?: string
  children: React.ReactNode
  className?: string
}

function FormCard({ title, description, icon: Icon, iconClassName, children, className, ...props }: FormCardProps) {
  return (
    <Card variant="glass" className={cn("w-full", className)} {...props}>
      <CardHeader>
        {Icon ? (
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20",
              iconClassName
            )}>
              <Icon className="size-5 text-electric-iris" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-glacier">{title}</CardTitle>
              {description && (
                <p className="text-sm text-fog">{description}</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <CardTitle className="text-glacier">{title}</CardTitle>
            {description && (
              <p className="text-sm text-fog">{description}</p>
            )}
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
}

export { FormCard }
