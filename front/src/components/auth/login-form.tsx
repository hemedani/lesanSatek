"use client"

import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, ArrowLeft, Lock, Mail } from "lucide-react"

import { Form } from "@/components/ui/form"
import { AuthInput } from "@/components/auth/auth-input"
import { AuthButton } from "@/components/auth/auth-button"
import { login } from "@/app/actions/auth/login"
import { useAuthStore } from "@/stores/authStore"

const loginSchema = z.object({
  email: z.string().min(1, "ایمیل یا شماره موبایل را وارد کنید"),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
})

type LoginData = z.infer<typeof loginSchema>

function setActiveRoleCookie(roleId: string) {
  document.cookie = `activeRoleId=${encodeURIComponent(roleId)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { setUser, setActiveRoleId } = useAuthStore()

  const form = useForm<LoginData>({
    resolver: zodV4Resolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: LoginData) => {
    setError(null)
    const result = await login({ email: data.email, password: data.password })

    if (result.success && result.body?.user) {
      const user = result.body.user
      const { getDefaultPanel, getAccessiblePanels, getHighestRole } = await import("@/lib/roles")
      const panels = getAccessiblePanels(user)
      setUser(user, panels)
      const firstRole = getHighestRole(user.roles) || user.roles?.[0]
      if (firstRole) {
        setActiveRoleId(firstRole.roleId)
        setActiveRoleCookie(firstRole.roleId)
      }
      const defaultPanel = getDefaultPanel(user)
      const redirect = new URLSearchParams(window.location.search).get("redirect")
      const isSafeRedirect = !!redirect && redirect.startsWith(defaultPanel)
      router.push(isSafeRedirect ? redirect : defaultPanel)
    } else {
      setError(result.body?.message || "ایمیل یا رمز عبور اشتباه است")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-ember/25 bg-ember/10 px-3.5 py-2.5 text-sm text-ember motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200"
          >
            <AlertCircle className="size-4.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <AuthInput
          control={form.control}
          name="email"
          label="ایمیل یا شماره موبایل"
          icon={Mail}
          type="text"
          placeholder="example@email.com"
          autoComplete="username"
          dir="ltr"
        />

        <AuthInput
          control={form.control}
          name="password"
          label="رمز عبور"
          icon={Lock}
          password
          placeholder="••••••••"
          autoComplete="current-password"
          dir="ltr"
        />

        <div className="flex justify-end">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-sm text-frost-link/80 transition-colors hover:text-frost-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/40 rounded-sm"
          >
            رمز عبور خود را فراموش کرده‌اید؟
          </a>
        </div>

        <AuthButton loading={form.formState.isSubmitting} icon={ArrowLeft}>
          ورود به سامانه
        </AuthButton>
      </form>
    </Form>
  )
}

export { LoginForm }