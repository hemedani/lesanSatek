"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, User, KeyRound, Building2, ShieldCheck, Loader2, Check, X, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { FormInput } from "@/components/form/form-input"
import { FormSelect } from "@/components/form/form-select"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormPasswordInput } from "@/components/form/form-password-input"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import { FormSearchSelect } from "@/components/form/form-search-select"
import { addUser } from "@/app/actions/user/addUser"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { gets as getStates } from "@/app/actions/state/gets"
import { gets as getCities } from "@/app/actions/city/gets"
import { FEATURES_OPTIONS } from "@/types/permissions"
import type { FeatureName } from "@/types/permissions"
import type { ReqType } from "@/types/declarations/selectInp"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const userSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  gender: z.enum(["Male", "Female"], { message: "انتخاب جنسیت الزامی است" }),
  birth_date: z.string().optional(),
  position: z.string().optional(),
  email: z.string().email("ایمیل نامعتبر است"),
  mobile: z.string().min(10, "شماره موبایل نامعتبر است"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  is_verified: z.boolean(),
  isActive: z.boolean(),
  organization: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
})

type UserData = z.infer<typeof userSchema>

const genderOptions = [
  { value: "Male", label: "مرد" },
  { value: "Female", label: "زن" },
]

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  children,
}: {
  icon: React.ElementType
  iconClassName?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Card variant="glass" className="[--card-spacing:--spacing(6)]">
      <CardHeader className="pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20",
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

export default function AddUserPage() {
  const router = useRouter()
  const [features, setFeatures] = useState<FeatureName[]>([])

  const form = useForm<UserData>({
    resolver: zodV4Resolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      gender: "Male",
      birth_date: "",
      position: "",
      email: "",
      mobile: "",
      password: "",
      is_verified: false,
      isActive: true,
      organization: "",
      state: "",
      city: "",
    },
  })

  const selectedState = form.watch("state")

  const toggleFeature = (feature: FeatureName) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature],
    )
  }

  const onSubmit = async (data: UserData) => {
    try {
      const { organization, ...rest } = data
      const result = await addUser(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          first_name: rest.first_name,
          last_name: rest.last_name,
          gender: rest.gender,
          birth_date: rest.birth_date || undefined,
          position: rest.position || undefined,
          isActive: rest.isActive,
          mobile: rest.mobile,
          email: rest.email,
          password: rest.password,
          is_verified: rest.is_verified,
          ...(organization ? { organizations: [organization] } : {}),
          ...(rest.state ? { state: rest.state } : {}),
          ...(rest.city ? { city: rest.city } : {}),
          features: features.map((feature) => ({ feature })),
        },
        { _id: 1, first_name: 1, last_name: 1, email: 1 },
      )
      if (result.success) {
        toast.success("کاربر با موفقیت ایجاد شد")
        router.push("/admin/users")
      } else {
        toast.error(result.body?.message || "خطا در ایجاد کاربر")
      }
    } catch {
      toast.error("خطا در ایجاد کاربر")
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="افزودن کاربر"
        description="اطلاعات هویتی و ورود کاربر را وارد کنید؛ پس از ایجاد، می‌توانید نقش و سطح دسترسی را تعیین کنید."
      >
        <div className="flex items-center gap-2">
          <HelpLauncher topicId="admin-user-add" tooltip="راهنمای ایجاد کاربر" />
          <Link href="/admin/users">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به کاربران
            </Button>
          </Link>
        </div>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={User}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="اطلاعات هویتی"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="first_name"
                label="نام"
                placeholder="مثال: علی"
                required
                disabled={submitting}
              />
              <FormInput
                control={form.control}
                name="last_name"
                label="نام خانوادگی"
                placeholder="مثال: محمدی"
                required
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormSelect
                control={form.control}
                name="gender"
                label="جنسیت"
                placeholder="انتخاب جنسیت…"
                options={genderOptions}
                required
                disabled={submitting}
              />
              <FormJalaliDatePicker
                control={form.control}
                name="birth_date"
                label="تاریخ تولد"
                placeholder="انتخاب تاریخ…"
                disabled={submitting}
              />
            </div>
            <FormInput
              control={form.control}
              name="position"
              label="سمت"
              placeholder="مثال: مدیر مالی"
              disabled={submitting}
            />
          </SectionCard>

          <SectionCard
            icon={KeyRound}
            iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
            title="اطلاعات ورود"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="email"
                label="ایمیل"
                placeholder="example@email.com"
                type="email"
                required
                disabled={submitting}
              />
              <FormInput
                control={form.control}
                name="mobile"
                label="شماره موبایل"
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                required
                disabled={submitting}
              />
            </div>
            <FormPasswordInput
              control={form.control}
              name="password"
              label="رمز عبور"
              placeholder="حداقل ۶ کاراکتر"
              required
              disabled={submitting}
            />
            <FormCheckbox
              control={form.control}
              name="is_verified"
              label="حساب کاربر تایید شده است"
              disabled={submitting}
            />
          </SectionCard>

          <SectionCard
            icon={Building2}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="سازمان و موقعیت"
          >
            <FormSearchSelect
              control={form.control}
              name="organization"
              label="سازمان"
              placeholder="انتخاب سازمان…"
              disabled={submitting}
              fetcher={async (search?: string) => {
                const result = await getOrganizations(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                  { _id: 1, name: 1 },
                )
                if (!result.success || !result.body) return []
                return result.body.map((o: { _id?: string; name?: string }) => ({
                  _id: o._id || "",
                  name: o.name || "",
                }))
              }}
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormSearchSelect
                control={form.control}
                name="state"
                label="استان"
                placeholder="انتخاب استان…"
                disabled={submitting}
                fetcher={async (search?: string) => {
                  const result = await getStates(
                    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                    { _id: 1, name: 1 },
                  )
                  if (!result.success || !result.body) return []
                  return result.body.map((s: { _id?: string; name?: string }) => ({
                    _id: s._id || "",
                    name: s.name || "",
                  }))
                }}
              />
              <FormSearchSelect
                control={form.control}
                name="city"
                label="شهر"
                placeholder="انتخاب شهر…"
                disabled={submitting}
                fetcher={async (search?: string) => {
                  const result = await getCities(
                    {
                      activeRoleId: getActiveRoleIdFromStore(),
                      page: 1,
                      limit: 50,
                      search: search || undefined,
                      ...(selectedState ? { stateId: selectedState } : {}),
                    } as unknown as ReqType["main"]["city"]["gets"]["set"],
                    { _id: 1, name: 1 },
                  )
                  if (!result.success || !result.body) return []
                  return result.body.map((c: { _id?: string; name?: string }) => ({
                    _id: c._id || "",
                    name: c.name || "",
                  }))
                }}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={ShieldCheck}
            iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
            title="دسترسی‌های ویژه"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FEATURES_OPTIONS.map((opt) => {
                const active = features.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleFeature(opt.value)}
                    disabled={submitting}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
                      active
                        ? "border-electric-iris/25 bg-electric-iris/10 text-frost-link"
                        : "border-steel-border/20 bg-white/[0.02] text-fog/70 hover:border-steel-border/40 hover:text-moonlight",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded transition-colors",
                        active
                          ? "bg-electric-iris text-white"
                          : "border border-steel-border/30 bg-white/[0.05] text-transparent",
                      )}
                    >
                      <Check className="size-3.5" />
                    </div>
                    <span>{opt.label}</span>
                  </button>
                )
              })}
            </div>
            <FormCheckbox control={form.control} name="isActive" label="فعال" disabled={submitting} />
          </SectionCard>

          <div className="flex items-start gap-2.5 rounded-xl border border-frost-link/15 bg-frost-link/5 px-4 py-3 text-body-sm text-fog">
            <Info className="mt-0.5 size-5 shrink-0 text-frost-link" />
            <p>
              نقش‌ها و محدوده دسترسی پس از ایجاد کاربر، از صفحه «نقش‌ها» برای هر کاربر قابل تنظیم است.
            </p>
          </div>

          <div className="sticky bottom-0 z-10">
            <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <p className="hidden text-caption text-fog/60 sm:block">
                فیلدهای ستاره‌دار الزامی هستند
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="flex-1 gap-2 px-5 sm:flex-none"
                >
                  {submitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Check className="size-5" />
                  )}
                  ثبت کاربر
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={submitting}
                  onClick={() => router.push("/admin/users")}
                  className="gap-2 px-5"
                >
                  <X className="size-5" />
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
