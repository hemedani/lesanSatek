"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
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
    <html dir="rtl" lang="fa">
      <body className="bg-[#05060f]">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-ember/10">
            <AlertTriangle className="size-8 text-ember" />
          </div>
          <h1 className="text-xl font-semibold text-glacier">خطای سیستمی</h1>
          <p className="max-w-md text-sm text-fog">
            متأسفانه خطایی رخ داده است. لطفاً مجدداً تلاش کنید.
          </p>
          <Button onClick={reset} variant="default" className="mt-2">
            تلاش مجدد
          </Button>
        </div>
      </body>
    </html>
  )
}
