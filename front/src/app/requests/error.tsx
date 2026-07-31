"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RequestsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="glass-card flex max-w-md flex-col items-center gap-4 rounded-2xl px-8 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-ember/10">
          <AlertTriangle className="size-8 text-ember" />
        </div>
        <h1 className="text-xl font-semibold text-glacier">خطا در درخواست‌ها</h1>
        <p className="max-w-md text-sm text-fog">
          خطایی رخ داده است. لطفاً مجدداً تلاش کنید.
        </p>
        <Button onClick={reset} variant="default" className="mt-2">
          تلاش مجدد
        </Button>
      </div>
    </div>
  )
}
