"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function UnitHeadError({
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-ember/10">
        <AlertTriangle className="size-8 text-ember" />
      </div>
      <h1 className="text-xl font-semibold text-glacier">خطا در پنل واحد</h1>
      <p className="max-w-md text-sm text-fog">
        خطایی رخ داده است. لطفاً مجدداً تلاش کنید.
      </p>
      <Button onClick={reset} variant="default" className="mt-2">
        تلاش مجدد
      </Button>
    </div>
  )
}
