import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FormCardProps extends React.ComponentProps<typeof Card> {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

function FormCard({ title, description, children, className, ...props }: FormCardProps) {
  return (
    <Card className={cn("w-full glass-card", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-glacier">{title}</CardTitle>
        {description && (
          <p className="text-sm text-fog">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
}

export { FormCard }
