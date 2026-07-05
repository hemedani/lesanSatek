"use client"

import { ErrorState } from "@/components/ui/error-state"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <ErrorState
        title="خطا در بارگذاری صفحه"
        message={error.message || "مشکلی پیش آمده است. لطفاً مجدداً تلاش کنید."}
        onRetry={reset}
      />
    </div>
  )
}
