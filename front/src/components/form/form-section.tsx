import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <Card variant="glass" className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-glacier">{title}</CardTitle>
        {description && (
          <p className="text-sm text-fog/70 leading-relaxed">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {children}
      </CardContent>
    </Card>
  )
}

export { FormSection }
