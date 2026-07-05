"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

function ErrorState({
  title = "خطا در دریافت اطلاعات",
  message = "مشکلی پیش آمده است. لطفاً مجدداً تلاش کنید.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center rounded-lg glass-card border-ember/20", className)}>
      <AlertTriangle className="size-10 text-ember mb-3" />
      <h3 className="text-sm font-medium text-moonlight">{title}</h3>
      <p className="mt-1 text-sm text-fog max-w-xs">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry} className="mt-4 text-frost-link">
          تلاش مجدد
        </Button>
      )}
    </div>
  )
}

export { ErrorState }
