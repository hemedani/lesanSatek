"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, User, KeyRound, ShieldCheck, Shield, Share2, Loader2, Check, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { FormInput } from "@/components/form/form-input"
import { FormSelect } from "@/components/form/form-select"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { updateUser } from "@/app/actions/user/updateUser"
import { removeUser } from "@/app/actions/user/removeUser"
import { FEATURES_OPTIONS } from "@/types/permissions"
import type { FeatureName } from "@/types/permissions"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface UserEditRole {
  roleId?: string
  name?: string
  scopeType?: "organization" | "unit" | "store"
  scopeId?: string
}

export interface UserEditData {
  _id: string
  first_name?: string
  last_name?: string
  email?: string
  mobile?: string
  gender?: "Male" | "Female"
  isActive?: boolean
  is_verified?: boolean
  position?: string
  birth_date?: string
  roles?: UserEditRole[]
  features?: string[]
}

export type ScopeNameMap = Record<string, string>

const userSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  gender: z.enum(["Male", "Female"], { message: "انتخاب جنسیت الزامی است" }),
  birth_date: z.string().optional(),
  position: z.string().optional(),
  email: z.string().email("ایمیل نامعتبر است"),
  mobile: z.string().min(10, "شماره موبایل نامعتبر است"),
  is_verified: z.boolean(),
  isActive: z.boolean(),
})

type UserData = z.infer<typeof userSchema>

const genderOptions = [
  { value: "Male", label: "مرد" },
  { value: "Female", label: "زن" },
]

const ROLE_LABELS: Record<string, string> = {
  Manager: "مدیر",
  Admin: "ادمین",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
  StoreHead: "رئیس انبار",
  Employee: "کارمند",
  Ordinary: "عادی",
}

const SCOPE_LABELS: Record<string, string> = {
  organization: "سازمان",
  unit: "واحد",
  store: "انبار",
}

function roleLabel(name?: string): string {
  return name ? ROLE_LABELS[name] ?? name : "عادی"
}

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

interface UserEditClientProps {
  user: UserEditData
  scopeNameMap: ScopeNameMap
}

export function UserEditClient({ user, scopeNameMap }: UserEditClientProps) {
  const router = useRouter()
  const [features, setFeatures] = useState<FeatureName[]>(
    (user.features || []).filter((f) => FEATURES_OPTIONS.some((o) => o.value === f)) as FeatureName[],
  )
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<UserData>({
    resolver: zodV4Resolver(userSchema),
    defaultValues: {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      gender: user.gender || "Male",
      birth_date: user.birth_date || "",
      position: user.position || "",
      email: user.email || "",
      mobile: user.mobile || "",
      is_verified: user.is_verified ?? false,
      isActive: user.isActive ?? true,
    },
  })

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ")

  const toggleFeature = (feature: FeatureName) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature],
    )
  }

  const onSubmit = async (data: UserData) => {
    try {
      const result = await updateUser(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: user._id,
          first_name: data.first_name,
          last_name: data.last_name,
          gender: data.gender,
          birth_date: data.birth_date || undefined,
          position: data.position || undefined,
          email: data.email,
          mobile: data.mobile,
          is_verified: data.is_verified,
          isActive: data.isActive,
          features: features.map((feature) => ({ feature })),
        },
        { _id: 1, first_name: 1, last_name: 1 },
      )
      if (result.success) {
        toast.success("کاربر با موفقیت به‌روزرسانی شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی کاربر")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی کاربر")
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await removeUser({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: user._id,
      })
      if (result.success) {
        toast.success("کاربر با موفقیت حذف شد")
        router.push("/admin/users")
      } else {
        toast.error(result.body?.message || "خطا در حذف کاربر")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف کاربر")
      setDeleting(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={fullName || "ویرایش کاربر"}
        description="ویرایش اطلاعات هویتی، ورود و دسترسی‌های کاربر"
      >
        <div className="flex items-center gap-2">
          <HelpLauncher topicId="admin-user-edit" tooltip="راهنمای ویرایش کاربر" />
          <Link href="/admin/users">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به کاربران
            </Button>
          </Link>
          <Link href={`/admin/users/${user._id}/roles`}>
            <Button variant="ghost" className="gap-2 px-4">
              <Shield className="size-5" />
              مدیریت نقش‌ها
            </Button>
          </Link>
          <Link href={`/admin/users/${user._id}/relations`}>
            <Button variant="ghost" className="gap-2 px-4">
              <Share2 className="size-5" />
              ویرایش روابط
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={() => setShowDelete(true)}
            className="gap-2 px-4 text-ember hover:bg-ember/5 hover:text-ember"
          >
            <Trash2 className="size-5" />
            حذف
          </Button>
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
            <div className="flex flex-wrap gap-4">
              <FormCheckbox
                control={form.control}
                name="is_verified"
                label="حساب کاربر تایید شده است"
                disabled={submitting}
              />
              <FormCheckbox
                control={form.control}
                name="isActive"
                label="فعال"
                disabled={submitting}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={Shield}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="نقش‌ها"
          >
            <p className="text-body-sm text-fog/70">
              نقش‌ها و محدوده دسترسی این کاربر از صفحه اختصاصی نقش‌ها قابل مدیریت است.
            </p>
            {(user.roles || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.roles?.map((role, i) => {
                  const scopeName = role.scopeId ? scopeNameMap[role.scopeId] : undefined
                  return (
                    <Badge key={i} variant="outline" className="gap-1 px-2 py-0.5 text-[11px] font-normal">
                      <Shield className="size-3 text-electric-iris" />
                      {roleLabel(role.name)}
                      {role.scopeType && (
                        <span className="text-fog/60">
                          · {SCOPE_LABELS[role.scopeType] ?? role.scopeType}
                          {scopeName ? ` · ${scopeName}` : ""}
                        </span>
                      )}
                    </Badge>
                  )
                })}
              </div>
            )}
            <Link href={`/admin/users/${user._id}/roles`}>
              <Button type="button" variant="outline" className="gap-2">
                <Shield className="size-5" />
                مدیریت نقش‌ها
              </Button>
            </Link>
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
          </SectionCard>

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
                  ذخیره تغییرات
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

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف کاربر"
        description={`آیا از حذف «${fullName || "این کاربر"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
