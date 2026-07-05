import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-midnight-ink">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(186,215,247,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(186,215,247,0.03)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-glacier tracking-tight">
            ساتک
          </h1>
          <p className="mt-2 text-sm text-fog">
            به سامانه مدیریت فرآیندهای سازمانی خوش آمدید
          </p>
        </div>

        <div className="rounded-2xl bg-graphite-plate p-8 ring-1 ring-foreground/10 shadow-subtle-4">
          <h2 className="mb-7 text-base font-medium text-moonlight">
            ورود به سامانه
          </h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-fog">
          حساب کاربری ندارید؟{" "}
          <Link href="/register" className="text-frost-link hover:underline font-medium">
            ثبت‌نام
          </Link>
        </p>
      </div>
    </div>
  )
}
