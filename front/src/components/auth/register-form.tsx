"use client"

import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
      <div className="rounded-sm bg-cipher-mint/10 px-4 py-3 text-sm text-cipher-mint text-center">
        ثبت‌نام با موفقیت انجام شد. به صفحه ورود هدایت می‌شوید...
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نام</FormLabel>
                <FormControl>
                  <Input placeholder="علی" dir="rtl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نام خانوادگی</FormLabel>
                <FormControl>
                  <Input placeholder="احمدی" dir="rtl" className="h-10" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ایمیل</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="example@email.com"
                  dir="rtl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>شماره موبایل</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  dir="rtl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رمز عبور</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="حداقل ۶ کاراکتر"
                  dir="rtl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "ثبت‌نام"
          )}
        </Button>
      </form>
    </Form>
  )
}

export { RegisterForm }
