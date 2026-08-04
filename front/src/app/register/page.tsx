import { Sparkles } from "lucide-react"
import Link from "next/link"

import { RegisterForm } from "@/components/auth/register-form"
import { AuthPage } from "@/components/auth/auth-page"

export default function RegisterPage() {
  return (
    <AuthPage
      icon={Sparkles}
      title="ایجاد حساب کاربری"
      subtitle="در چند ثانیه ثبت‌نام کنید و مدیریت خرید سازمان خود را آغاز کنید"
      toggle={
        <>
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link
            href="/login"
            className="font-medium text-frost-link transition-colors hover:text-glacier focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/40 rounded-sm"
          >
            وارد شوید
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthPage>
  )
}