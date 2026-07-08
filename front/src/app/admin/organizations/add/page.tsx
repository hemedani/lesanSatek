"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormSection } from "@/components/form/form-section";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Form } from "@/components/ui/form";
import { add } from "@/app/actions/organization/add";
import { gets as getStates } from "@/app/actions/state/gets";
import { gets as getCities } from "@/app/actions/city/gets";
import type { ReqType } from "@/types/declarations/selectInp";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

const orgSchema = z.object({
  name: z.string().min(1, "نام سازمان الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  isActive: z.boolean(),
});

type OrgData = z.input<typeof orgSchema>;

export default function AddOrganizationPage() {
  const router = useRouter();
  const form = useForm<OrgData>({
    resolver: zodV4Resolver(orgSchema),
    defaultValues: {
      name: "",
      enName: "",
      description: "",
      state: "",
      city: "",
      isActive: true,
    },
  });

  const selectedState = form.watch("state");

  const onSubmit = async (data: OrgData) => {
    const result = await add(
      { activeRoleId: getActiveRoleIdFromStore(), ...data, isActive: data.isActive },
      { _id: 1, name: 1 }
    );
    if (result.success) {
      toast.success("سازمان با موفقیت ایجاد شد");
      router.push("/admin/organizations");
    } else {
      toast.error(result.body?.message || "خطا در ایجاد سازمان");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Breadcrumbs />
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 border border-electric-iris/20">
            <Building2 className="size-5 text-electric-iris" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-heading-sm font-medium text-glacier tracking-tight leading-tight">
              سازمان جدید
            </h1>
            <p className="text-body-sm text-fog/70 leading-relaxed">
              ایجاد سازمان جدید در سامانه. پس از ایجاد می‌توانید بخش‌ها و کاربران مرتبط را تعریف کنید.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormSection
            title="اطلاعات پایه"
            description="نام و مشخصات اصلی سازمان"
          >
            <FormInput
              control={form.control}
              name="name"
              label="نام سازمان"
              placeholder="مثال: شرکت نمونه"
              required
              disabled={form.formState.isSubmitting}
            />
            <FormInput
              control={form.control}
              name="enName"
              label="نام انگلیسی"
              placeholder="Example: Sample Inc."
              disabled={form.formState.isSubmitting}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormSearchSelect
                control={form.control}
                name="state"
                label="استان"
                placeholder="انتخاب استان..."
                disabled={form.formState.isSubmitting}
                fetcher={async (search?: string) => {
                  const result = await getStates(
                    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
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
                disabled={form.formState.isSubmitting}
                fetcher={async (search?: string) => {
                  const result = await getCities(
                    {
                      activeRoleId: getActiveRoleIdFromStore(),
                      page: 1,
                      limit: 50,
                      search: search || undefined,
                      ...(selectedState ? { stateId: selectedState } : {}),
                    } as unknown as ReqType["main"]["city"]["gets"]["set"],
                    { _id: 1, name: 1 }
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
            title="توضیحات و وضعیت"
            description="اطلاعات تکمیلی و تنظیمات فعال بودن سازمان"
          >
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              placeholder="توضیحات مختصری درباره سازمان..."
              rows={3}
              disabled={form.formState.isSubmitting}
            />
            <FormCheckbox
              control={form.control}
              name="isActive"
              label="فعال"
              disabled={form.formState.isSubmitting}
            />
          </FormSection>

          <div className="sticky bottom-0 z-10 bg-[rgba(5,6,15,0.85)] backdrop-blur-xl border border-steel-border/15 rounded-xl p-4 flex items-center justify-end gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
            <Link href="/admin/organizations">
              <Button type="button" variant="ghost" disabled={form.formState.isSubmitting}>
                انصراف
              </Button>
            </Link>
            <Button type="submit" disabled={form.formState.isSubmitting} className="gap-1.5 min-w-[120px]">
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال ایجاد...
                </>
              ) : (
                "ایجاد سازمان"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
