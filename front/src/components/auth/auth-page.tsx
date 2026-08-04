import type { LucideIcon } from "lucide-react"
import { LockKeyhole } from "lucide-react"

import { AuthCard } from "@/components/auth/auth-card"
import { AuthLayout } from "@/components/auth/auth-layout"

interface AuthPageProps {
  icon: LucideIcon
  title: string
  subtitle: string
  toggle: React.ReactNode
  children: React.ReactNode
}

function AuthPage({ icon, title, subtitle, toggle, children }: AuthPageProps) {
  return (
    <AuthLayout>
      <AuthCard icon={icon} title={title} subtitle={subtitle}>
        {children}
      </AuthCard>

      <p className="mt-6 text-center text-sm text-pebble">
        {toggle}
      </p>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-fog/70">
        <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
        داده‌های شما با رمزنگاری سطح بانکی محافظت می‌شود
      </p>
    </AuthLayout>
  )
}

export { AuthPage }