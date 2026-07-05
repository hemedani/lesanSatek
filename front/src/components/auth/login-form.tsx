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
import { login } from "@/app/actions/auth/login"
import { useAuthStore } from "@/stores/authStore"

const loginSchema = z.object({
  email: z.string().min(1, "ایمیل یا شماره موبایل را وارد کنید"),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
})

type LoginData = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const setUser = useAuthStore((s) => s.setUser)

  const form = useForm<LoginData>({
    resolver: zodV4Resolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (data: LoginData) => {
    setError(null)
    const result = await login({ email: data.email, password: data.password })

    if (result.success && result.body?.user) {
      setUser(result.body.user)
      router.push("/admin")
    } else {
      setError(result.body?.message || "ایمیل یا رمز عبور اشتباه است")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="rounded-sm bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ایمیل یا شماره موبایل</FormLabel>
              <FormControl>
                <Input
                  type="text"
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رمز عبور</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
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
            "ورود"
          )}
        </Button>
      </form>
    </Form>
  )
}

export { LoginForm }
