"use client"

import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, CheckCheck, Lock, Mail, Phone, Sparkles, User } from "lucide-react"

import { Form } from "@/components/ui/form"
import { AuthInput } from "@/components/auth/auth-input"
import { AuthButton } from "@/components/auth/auth-button"
import { register } from "@/app/actions/auth/register"

const registerSchema = z.object({
  first_name: z.string().min(1, "نام را وارد کنید"),
  last_name: z.string().min(1, "نام خانوادگی را وارد کنید"),
  email: z.string().min(1, "ایمیل را وارد کنید").email("ایمیل نامعتبر است"),
  mobile: z.string().min(1, "شماره موبایل را وارد کنید"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
})

type RegisterData = z.infer<typeof registerSchema>

function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<RegisterData>({
    resolver: zodV4Resolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      mobile: "",
      password: "",
    },
  })

  const onSubmit = async (data: RegisterData) => {
    setError(null)
    const result = await register({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      mobile: data.mobile,
      password: data.password,
      isActive: true,
      gender: "Male",
      features: [],
    })

    if (result.success) {
      setSuccess(true)
      setTimeout(() => router.push("/login"), 2000)
    } else {
      setError(result.body?.message || "خطا در ثبت‌نام")
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-cipher-mint/25 bg-cipher-mint/10 px-4 py-3.5 text-sm text-cipher-mint motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-300">
        <CheckCheck className="size-4.5 shrink-0" aria-hidden="true" />
        <span>ثبت‌نام با موفقیت انجام شد. به صفحه ورود هدایت می‌شوید...</span>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-ember/25 bg-ember/10 px-3.5 py-2.5 text-sm text-ember motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200"
          >
            <AlertCircle className="size-4.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <AuthInput
            control={form.control}
            name="first_name"
            label="نام"
            icon={User}
            placeholder="علی"
            autoComplete="given-name"
          />

          <AuthInput
            control={form.control}
            name="last_name"
            label="نام خانوادگی"
            icon={User}
            placeholder="احمدی"
            autoComplete="family-name"
          />
        </div>

        <AuthInput
          control={form.control}
          name="email"
          label="ایمیل"
          icon={Mail}
          type="email"
          placeholder="example@email.com"
          autoComplete="email"
          dir="ltr"
        />

        <AuthInput
          control={form.control}
          name="mobile"
          label="شماره موبایل"
          icon={Phone}
          type="tel"
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          autoComplete="tel"
        />

        <AuthInput
          control={form.control}
          name="password"
          label="رمز عبور"
          icon={Lock}
          password
          placeholder="حداقل ۶ کاراکتر"
          autoComplete="new-password"
          dir="ltr"
        />

        <AuthButton loading={form.formState.isSubmitting} icon={Sparkles}>
          ایجاد حساب کاربری
        </AuthButton>
      </form>
    </Form>
  )
}

export { RegisterForm }