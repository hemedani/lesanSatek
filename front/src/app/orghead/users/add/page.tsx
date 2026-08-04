"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Loader2, User, Shield, X, KeyRound, UserCog, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/form/form-input"
import { FormSelect } from "@/components/form/form-select"
import { FormPasswordInput } from "@/components/form/form-password-input"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { SectionCard } from "@/components/form/section-card"
import { SearchSelect } from "@/components/form/form-search-select"
import { Form } from "@/components/ui/form"
import { PageHeader } from "@/components/ui/page-header"
import { addUser } from "@/app/actions/user/addUser"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { ROLE_OPTIONS, SCOPE_OPTIONS } from "@/types/permissions"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const userSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  email: z.string().email("ایمیل نامعتبر است"),
  mobile: z.string().min(10, "شماره موبایل نامعتبر است"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  gender: z.enum(["Male", "Female"]),
  position: z.string().optional(),
  isActive: z.boolean(),
  is_verified: z.boolean(),
})

type UserData = z.infer<typeof userSchema>

interface RoleEntry {
  name: string
  scopeType?: string
  scopeId?: string
}

export default function AddUserPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<RoleEntry[]>([{ name: "Ordinary" }])

  const form = useForm<UserData>({
    resolver: zodV4Resolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      mobile: "",
      password: "",
      gender: "Male",
      position: "",
      isActive: true,
      is_verified: false,
    },
  })

  const updateRole = (index: number, field: string, value: string) => {
    setRoles((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addRole = () => {
    setRoles((prev) => [...prev, { name: "Ordinary" }])
  }

  const removeRole = (index: number) => {
    setRoles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: UserData) => {
    try {
      const result = await addUser(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          mobile: data.mobile,
          password: data.password,
          gender: data.gender,
          position: data.position || undefined,
          isActive: data.isActive,
          is_verified: data.is_verified,
          roles: roles.map((r) => ({
            name: r.name as "Manager" | "Admin" | "OrgHead" | "UnitHead" | "Employee" | "Ordinary",
            ...(r.scopeType ? { scopeType: r.scopeType as "organization" | "unit" } : {}),
            ...(r.scopeId ? { scopeId: r.scopeId } : {}),
          })),
        },
        { _id: 1, first_name: 1, last_name: 1, email: 1 },
      )
      if (result.success) {
        toast.success("کاربر با موفقیت ایجاد شد")
        router.push("/orghead/users")
      } else {
        toast.error(result.body?.message || "خطا در ایجاد کاربر")
      }
    } catch {
      toast.error("خطا در ایجاد کاربر")
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="افزودن کاربر"
        description="اطلاعات هویتی و ورود کاربر را وارد کنید و نقش‌های دسترسی را مشخص کنید."
      >
        <Link href="/orghead/users">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به کاربران
          </Button>
        </Link>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={UserCog}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="اطلاعات هویتی"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormInput control={form.control} name="first_name" label="نام" placeholder="مثال: علی" required disabled={isSubmitting} />
              <FormInput control={form.control} name="last_name" label="نام خانوادگی" placeholder="مثال: محمدی" required disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormSelect control={form.control} name="gender" label="جنسیت" options={[{ value: "Male", label: "مرد" }, { value: "Female", label: "زن" }]} disabled={isSubmitting} />
              <FormInput control={form.control} name="position" label="سمت" placeholder="مثال: مدیر مالی" disabled={isSubmitting} />
            </div>
          </SectionCard>

          <SectionCard
            icon={KeyRound}
            iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
            title="اطلاعات ورود"
          >
            <FormInput control={form.control} name="email" label="ایمیل" placeholder="example@email.com" type="email" required disabled={isSubmitting} />
            <FormInput control={form.control} name="mobile" label="شماره موبایل" placeholder="۰۹۱۲۳۴۵۶۷۸۹" required disabled={isSubmitting} />
            <FormPasswordInput control={form.control} name="password" label="رمز عبور" placeholder="حداقل ۶ کاراکتر" required disabled={isSubmitting} />
            <FormCheckbox control={form.control} name="is_verified" label="حساب کاربر تایید شده است" disabled={isSubmitting} />
          </SectionCard>

          <SectionCard
            icon={User}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="نقش‌ها"
            description="تعیین نقش و محدوده دسترسی کاربر"
          >
            <div className="space-y-3">
              {roles.map((role, index) => (
                <div key={index} className="flex items-start gap-2 p-3.5 rounded-lg bg-white/[0.02] border border-steel-border/20">
                  <div className={cn(
                    "flex-1 grid gap-3",
                    role.scopeType ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
                  )}>
                    <div className="space-y-1.5">
                      <label className="text-xs text-fog/70 block font-medium">نقش</label>
                      <select
                        value={role.name}
                        onChange={(e) => updateRole(index, "name", e.target.value)}
                        disabled={isSubmitting}
                        className="w-full h-9 rounded-sm bg-white/[0.03] border border-steel-border/60 px-3 text-sm text-moonlight transition-all duration-200 outline-none hover:border-frost-link/20 focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-fog/70 block font-medium">حوزه</label>
                      <select
                        value={role.scopeType || ""}
                        onChange={(e) => {
                          updateRole(index, "scopeType", e.target.value)
                          if (!e.target.value) updateRole(index, "scopeId", "")
                        }}
                        disabled={isSubmitting}
                        className="w-full h-9 rounded-sm bg-white/[0.03] border border-steel-border/60 px-3 text-sm text-moonlight transition-all duration-200 outline-none hover:border-frost-link/20 focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {SCOPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {role.scopeType && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-fog/70 block font-medium">
                          {role.scopeType === "unit" ? "واحد" : "سازمان"}
                        </label>
                        <SearchSelect
                          value={role.scopeId || ""}
                          onChange={(v) => updateRole(index, "scopeId", v)}
                          placeholder={role.scopeType === "unit" ? "انتخاب واحد..." : "انتخاب سازمان..."}
                          fetcher={
                            role.scopeType === "unit"
                              ? async (search?: string) => {
                                  const result = await getUnits(
                                    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                                    { _id: 1, name: 1 },
                                  )
                                  if (!result.success || !result.body) return []
                                  return result.body.map((u: { _id?: string; name?: string }) => ({
                                    _id: u._id || "",
                                    name: u.name || "",
                                  }))
                                }
                              : async (search?: string) => {
                                  return []
                                }
                          }
                          label={role.scopeType === "unit" ? "واحد" : "سازمان"}
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                  </div>
                  {roles.length > 1 && (
                    <Button type="button" variant="ghost" size="icon-xs" className="mt-5 text-destructive shrink-0" onClick={() => removeRole(index)} disabled={isSubmitting}>
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRole} disabled={isSubmitting}>
                <Shield className="size-3.5" />
                افزودن نقش
              </Button>
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
                  disabled={isSubmitting}
                  className="flex-1 gap-2 px-5 sm:flex-none"
                >
                  {isSubmitting ? (
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
                  disabled={isSubmitting}
                  onClick={() => router.push("/orghead/users")}
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