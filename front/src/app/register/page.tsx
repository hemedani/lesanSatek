import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-glacier">
            ساتک
          </h1>
          <p className="mt-1 text-sm text-fog">
            ایجاد حساب کاربری جدید
          </p>
        </div>

        <div className="rounded-xl bg-graphite-plate p-6 ring-1 ring-foreground/10 shadow-subtle-4">
          <h2 className="mb-6 text-base font-medium text-moonlight">
            ثبت‌نام
          </h2>
          <RegisterForm />
        </div>

        <p className="mt-4 text-center text-sm text-fog">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/login" className="text-frost-link hover:underline">
            ورود
          </Link>
        </p>
      </div>
    </div>
  )
}
