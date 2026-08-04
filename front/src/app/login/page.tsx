import { LockKeyhole } from "lucide-react"
import Link from "next/link"

import { LoginForm } from "@/components/auth/login-form"
import { AuthPage } from "@/components/auth/auth-page"

export default function LoginPage() {
  return (
    <AuthPage
      icon={LockKeyhole}
      title="ورود به ساتک"
      subtitle="برای مدیریت فرآیندهای سازمانی خود وارد شوید"
      toggle={
        <>
          حساب کاربری ندارید؟{" "}
          <Link
            href="/register"
            className="font-medium text-frost-link transition-colors hover:text-glacier focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/40 rounded-sm"
          >
            ثبت‌نام کنید
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthPage>
  )
}