import { Clock } from "lucide-react"

export default function OrdinaryPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#05060f] p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(186,215,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(186,215,247,0.03)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-electric-iris/10 ring-1 ring-electric-iris/20">
          <Clock className="size-8 text-electric-iris" />
        </div>
        <h1 className="mb-3 text-2xl font-semibold text-glacier">به زودی</h1>
        <p className="text-sm text-fog leading-relaxed">
          حساب کاربری شما در حال بررسی است. به محض فعال‌سازی نقش مناسب،
          دسترسی به پنل مربوطه برای شما فراهم خواهد شد.
        </p>
      </div>
    </div>
  )
}
