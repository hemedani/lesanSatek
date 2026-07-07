"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus, Shield, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormPasswordInput } from "@/components/form/form-password-input";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormSection } from "@/components/form/form-section";
import { FormSearchSelect, SearchSelect } from "@/components/form/form-search-select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Form } from "@/components/ui/form";
import { addUser } from "@/app/actions/user/addUser";
import { gets as getOrganizations } from "@/app/actions/organization/gets";
import { gets as getUnits } from "@/app/actions/unit/gets";
import { gets as getStates } from "@/app/actions/state/gets";
import { gets as getCities } from "@/app/actions/city/gets";
import {
  FEATURES_OPTIONS,
  ROLE_OPTIONS,
  SCOPE_OPTIONS,
} from "@/types/permissions";
import { cn } from "@/lib/utils";
import type { ReqType } from "@/types/declarations/selectInp";
import Link from "next/link";

const userSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  email: z.string().email("ایمیل نامعتبر است"),
  mobile: z.string().min(10, "شماره موبایل نامعتبر است"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  gender: z.enum(["Male", "Female"]),
  position: z.string().optional(),
  birth_date: z.string().optional(),
  organization: z.string().min(1, "انتخاب سازمان الزامی است"),
  state: z.string().optional(),
  city: z.string().optional(),
  isActive: z.boolean(),
  is_verified: z.boolean(),
});

type UserData = z.input<typeof userSchema>;

interface RoleEntry {
  name: string;
  scopeType?: string;
  scopeId?: string;
}

export default function AddUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleEntry[]>([{ name: "Ordinary" }]);
  const [features, setFeatures] = useState<string[]>([]);

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
      birth_date: "",
      organization: "",
      state: "",
      city: "",
      isActive: true,
      is_verified: false,
    },
  });

  const selectedOrganization = form.watch("organization");
  const selectedState = form.watch("state");

  const updateRole = (index: number, field: string, value: string) => {
    setRoles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRole = () => {
    setRoles((prev) => [...prev, { name: "Ordinary" }]);
  };

  const removeRole = (index: number) => {
    setRoles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const onSubmit = async (data: UserData) => {
    const result = await addUser(
      {
        activeRoleId: "",
        ...data,
        features: features.map((f) => ({ feature: f as "canRegisterPurchaseRequest" })),
        roles: roles.map((r) => ({
          name: r.name as "Manager" | "Admin" | "OrgHead" | "UnitHead" | "Employee" | "Ordinary",
          ...(r.scopeType ? { scopeType: r.scopeType as "organization" | "unit" } : {}),
          ...(r.scopeId ? { scopeId: r.scopeId } : {}),
        })),
      },
      { _id: 1, first_name: 1, last_name: 1, email: 1 }
    );
    if (result.success) {
      toast.success("کاربر با موفقیت ایجاد شد");
      router.push("/admin/users");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در ایجاد کاربر");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Breadcrumbs />
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 border border-electric-iris/20">
            <UserPlus className="size-5 text-electric-iris" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-heading-sm font-medium text-glacier tracking-tight leading-tight">
              کاربر جدید
            </h1>
            <p className="text-body-sm text-fog/70 leading-relaxed">
              ایجاد کاربر جدید در سامانه. اطلاعات هویتی، رمز عبور و سطح دسترسی را تعیین کنید.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormSection
            title="اطلاعات هویتی"
            description="نام، نام خانوادگی و مشخصات فردی کاربر"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput
                control={form.control}
                name="first_name"
                label="نام"
                placeholder="مثال: علی"
                required
                disabled={isSubmitting}
              />
              <FormInput
                control={form.control}
                name="last_name"
                label="نام خانوادگی"
                placeholder="مثال: محمدی"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormSelect
                control={form.control}
                name="gender"
                label="جنسیت"
                options={[
                  { value: "Male", label: "مرد" },
                  { value: "Female", label: "زن" },
                ]}
                disabled={isSubmitting}
              />
              <FormInput
                control={form.control}
                name="birth_date"
                label="تاریخ تولد"
                type="date"
                disabled={isSubmitting}
              />
            </div>
            <FormInput
              control={form.control}
              name="position"
              label="سمت"
              placeholder="مثال: مدیر مالی"
              disabled={isSubmitting}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormSearchSelect
                control={form.control}
                name="state"
                label="استان"
                placeholder="انتخاب استان..."
                disabled={isSubmitting}
                fetcher={async (search?: string) => {
                  const result = await getStates(
                    { activeRoleId: "", page: 1, limit: 50, search: search || undefined },
                    { _id: 1, name: 1 }
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
                placeholder="انتخاب شهر..."
                disabled={isSubmitting}
                fetcher={async (search?: string) => {
                  const result = await getCities(
                    {
                      activeRoleId: "",
                      page: 1,
                      limit: 50,
                      search: search || undefined,
                      ...(selectedState ? { stateId: selectedState } : {}),
                    } as unknown as ReqType["main"]["city"]["gets"]["set"],
                    { _id: 1, name: 1, state: { _id: 1, name: 1 } }
                  )
                  if (!result.success || !result.body) return []
                  return result.body.map((c: { _id?: string; name?: string }) => ({
                    _id: c._id || "",
                    name: c.name || "",
                  }))
                }}
              />
            </div>
          </FormSection>

          <FormSection
            title="اطلاعات ورود"
            description="ایمیل، شماره موبایل و رمز عبور کاربر"
          >
            <FormInput
              control={form.control}
              name="email"
              label="ایمیل"
              placeholder="example@email.com"
              type="email"
              required
              disabled={isSubmitting}
            />
            <FormInput
              control={form.control}
              name="mobile"
              label="شماره موبایل"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              required
              disabled={isSubmitting}
            />
            <FormPasswordInput
              control={form.control}
              name="password"
              label="رمز عبور"
              placeholder="حداقل ۶ کاراکتر"
              required
              disabled={isSubmitting}
            />
            <FormCheckbox
              control={form.control}
              name="is_verified"
              label="حساب کاربر تایید شده است"
              disabled={isSubmitting}
            />
          </FormSection>

          <FormSection
            title="سازمان و سطح دسترسی"
            description="انتساب کاربر به سازمان و تعیین نقش و محدوده دسترسی"
          >
            <FormSearchSelect
              control={form.control}
              name="organization"
              label="سازمان"
              placeholder="انتخاب سازمان..."
              required
              disabled={isSubmitting}
              fetcher={async (search?: string) => {
                const result = await getOrganizations(
                  {
                    activeRoleId: "",
                    page: 1,
                    limit: 50,
                    search: search || undefined,
                  },
                  { _id: 1, name: 1 }
                )
                if (!result.success || !result.body) return []
                return result.body.map((org: { _id?: string; name?: string }) => ({
                  _id: org._id || "",
                  name: org.name || "",
                }))
              }}
            />
            <div className="space-y-3">
              {roles.map((role, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3.5 rounded-lg bg-white/[0.02] border border-steel-border/20"
                >
                  <div className={cn(
                    "flex-1 grid gap-3",
                    role.scopeType
                      ? "grid-cols-1 sm:grid-cols-3"
                      : "grid-cols-1 sm:grid-cols-2"
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
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
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
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {role.scopeType && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-fog/70 block font-medium">
                          {role.scopeType === "organization" ? "سازمان" : "واحد"}
                        </label>
                        <SearchSelect
                          value={role.scopeId || ""}
                          onChange={(v) => updateRole(index, "scopeId", v)}
                          placeholder={
                            role.scopeType === "organization"
                              ? "انتخاب سازمان..."
                              : "انتخاب واحد..."
                          }
                          fetcher={
                            role.scopeType === "organization"
                              ? async (search?: string) => {
                                  const result = await getOrganizations(
                                    {
                                      activeRoleId: "",
                                      page: 1,
                                      limit: 50,
                                      search: search || undefined,
                                    },
                                    { _id: 1, name: 1 }
                                  )
                                  if (!result.success || !result.body) return []
                                  return result.body.map((o: { _id?: string; name?: string }) => ({
                                    _id: o._id || "",
                                    name: o.name || "",
                                  }))
                                }
                              : async (search?: string) => {
                                  const result = await getUnits(
                                    {
                                      activeRoleId: "",
                                      page: 1,
                                      limit: 50,
                                      search: search || undefined,
                                      organizationId: selectedOrganization || undefined,
                                    },
                                    { _id: 1, name: 1 }
                                  )
                                  if (!result.success || !result.body) return []
                                  return result.body.map((u: { _id?: string; name?: string }) => ({
                                    _id: u._id || "",
                                    name: u.name || "",
                                  }))
                                }
                          }
                          label={role.scopeType === "organization" ? "سازمان" : "واحد"}
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                  </div>
                  {roles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="mt-5 text-destructive shrink-0"
                      onClick={() => removeRole(index)}
                      disabled={isSubmitting}
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={addRole}
                disabled={isSubmitting}
              >
                <Shield className="size-3.5" />
                افزودن نقش
              </Button>
            </div>
          </FormSection>

          <FormSection
            title="دسترسی‌های ویژه"
            description="تعیین دسترسی‌های خاص کاربر در سامانه"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEATURES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleFeature(opt.value)}
                  disabled={isSubmitting}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border ${
                    features.includes(opt.value)
                      ? "bg-electric-iris/10 border-electric-iris/25 text-frost-link"
                      : "bg-white/[0.02] border-steel-border/20 text-fog/70 hover:text-moonlight hover:border-steel-border/40"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className={`size-4 rounded flex items-center justify-center transition-colors ${
                    features.includes(opt.value)
                      ? "bg-electric-iris text-white"
                      : "bg-white/[0.05] border border-steel-border/30"
                  }`}>
                    {features.includes(opt.value) && <Check className="size-3" />}
                  </div>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </FormSection>

          <div className="sticky bottom-0 z-10 bg-[rgba(5,6,15,0.85)] backdrop-blur-xl border border-steel-border/15 rounded-xl p-4 flex items-center justify-end gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
            <Link href="/admin/users">
              <Button type="button" variant="ghost" disabled={isSubmitting}>
                انصراف
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5 min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال ایجاد...
                </>
              ) : (
                "ایجاد کاربر"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
