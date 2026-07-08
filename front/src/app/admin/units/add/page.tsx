"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSelect } from "@/components/form/form-select";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormSection } from "@/components/form/form-section";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Form } from "@/components/ui/form";
import { add } from "@/app/actions/unit/add";
import { gets as getOrgs } from "@/app/actions/organization/gets";
import { gets as getUnits } from "@/app/actions/unit/gets";
import { getUsers } from "@/app/actions/user/getUsers";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

const unitSchema = z.object({
  name: z.string().min(1, "نام واحد الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  type: z.string().min(1, "نوع واحد الزامی است"),
  isActive: z.boolean(),
  organizationId: z.string().optional(),
  parentUnitId: z.string().optional(),
  headId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  warehouseCapacity: z.number().optional(),
  hasColdStorage: z.boolean().optional(),
  fleetSize: z.number().optional(),
  serviceRadius: z.number().optional(),
});

type UnitData = z.input<typeof unitSchema>;

const unitTypeOptions = [
  { value: "General", label: "عمومی" },
  { value: "Warehouse", label: "انبار" },
  { value: "Logistics", label: "تدارکات" },
  { value: "Production", label: "تولید" },
  { value: "Administration", label: "اداری" },
  { value: "Expert", label: "کارشناسی" },
];

export default function AddUnitPage() {
  const router = useRouter();
  const form = useForm<UnitData>({
    resolver: zodV4Resolver(unitSchema),
    defaultValues: {
      name: "",
      enName: "",
      description: "",
      type: "",
      isActive: true,
      organizationId: "",
      parentUnitId: "",
      headId: "",
      address: "",
      phone: "",
      email: "",
      warehouseCapacity: undefined,
      hasColdStorage: false,
      fleetSize: undefined,
      serviceRadius: undefined,
    },
  });

  const selectedOrg = form.watch("organizationId");

  const onSubmit = async (data: UnitData) => {
    const result = await add(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        name: data.name,
        enName: data.enName || undefined,
        description: data.description || undefined,
        type: data.type as "General" | "Warehouse" | "Logistics" | "Production" | "Administration" | "Expert",
        isActive: data.isActive,
        organizationId: data.organizationId || undefined,
        parentUnitId: data.parentUnitId || undefined,
        headId: data.headId || undefined,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        warehouseCapacity: data.warehouseCapacity || undefined,
        hasColdStorage: data.hasColdStorage || undefined,
        fleetSize: data.fleetSize || undefined,
        serviceRadius: data.serviceRadius || undefined,
      },
      { _id: 1, name: 1 }
    );
    if (result.success) {
      toast.success("واحد با موفقیت ایجاد شد");
      router.push("/admin/units");
    } else {
      toast.error(result.body?.message || "خطا در ایجاد واحد");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <Breadcrumbs />
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 border border-electric-iris/20">
            <GitBranch className="size-5 text-electric-iris" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-heading-sm font-medium text-glacier tracking-tight leading-tight">
              واحد جدید
            </h1>
            <p className="text-body-sm text-fog/70 leading-relaxed">
              ایجاد واحد یا زیرواحد جدید در سازمان. پس از ایجاد می‌توانید سرپرست و ویژگی‌ها را تعریف کنید.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormSection
            title="اطلاعات پایه"
            description="نام، نوع و وضعیت واحد"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput
                control={form.control}
                name="name"
                label="نام واحد"
                placeholder="مثال: واحد تدارکات"
                required
                disabled={form.formState.isSubmitting}
              />
              <FormSelect
                control={form.control}
                name="type"
                label="نوع واحد"
                placeholder="انتخاب نوع..."
                options={unitTypeOptions}
                required
                disabled={form.formState.isSubmitting}
              />
            </div>
            <FormInput
              control={form.control}
              name="enName"
              label="نام انگلیسی"
              placeholder="Example: Procurement Unit"
              disabled={form.formState.isSubmitting}
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              placeholder="توضیحات مختصری درباره واحد..."
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

          <FormSection
            title="سازمان و ساختار"
            description="سازمان و واحد والد را مشخص کنید"
          >
            <FormSearchSelect
              control={form.control}
              name="organizationId"
              label="سازمان"
              placeholder="انتخاب سازمان..."
              disabled={form.formState.isSubmitting}
              fetcher={async (search?: string) => {
                const result = await getOrgs(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                  { _id: 1, name: 1 }
                );
                if (!result.success || !result.body) return [];
                return result.body.map((o: { _id?: string; name?: string }) => ({
                  _id: o._id || "",
                  name: o.name || "",
                }));
              }}
            />
            <FormSearchSelect
              control={form.control}
              name="parentUnitId"
              label="واحد والد"
              placeholder="انتخاب واحد والد..."
              disabled={form.formState.isSubmitting}
              fetcher={async (search?: string) => {
                const result = await getUnits(
                  {
                    activeRoleId: getActiveRoleIdFromStore(),
                    page: 1,
                    limit: 50,
                    search: search || undefined,
                    ...(selectedOrg ? { organizationId: selectedOrg } : {}),
                  },
                  { _id: 1, name: 1 }
                );
                if (!result.success || !result.body) return [];
                return result.body.map((u: { _id?: string; name?: string }) => ({
                  _id: u._id || "",
                  name: u.name || "",
                }));
              }}
            />
            <FormSearchSelect
              control={form.control}
              name="headId"
              label="سرپرست واحد"
              placeholder="انتخاب سرپرست..."
              disabled={form.formState.isSubmitting}
              fetcher={async (search?: string) => {
                const result = await getUsers(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                  { _id: 1, first_name: 1, last_name: 1 }
                );
                if (!result.success || !result.body) return [];
                return result.body.map((u: { _id?: string; first_name?: string; last_name?: string }) => ({
                  _id: u._id || "",
                  name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—",
                }));
              }}
            />
          </FormSection>

          <FormSection
            title="اطلاعات تماس"
            description="آدرس، تلفن و ایمیل واحد"
          >
            <FormInput
              control={form.control}
              name="address"
              label="آدرس"
              placeholder="آدرس واحد..."
              disabled={form.formState.isSubmitting}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput
                control={form.control}
                name="phone"
                label="تلفن"
                placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                disabled={form.formState.isSubmitting}
              />
              <FormInput
                control={form.control}
                name="email"
                label="ایمیل"
                placeholder="unit@example.com"
                disabled={form.formState.isSubmitting}
              />
            </div>
          </FormSection>

          <FormSection
            title="ویژگی‌های انبار"
            description="مشخصات مرتبط با ظرفیت انبارداری"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput
                control={form.control}
                name="warehouseCapacity"
                label="ظرفیت انبار (متر مربع)"
                type="number"
                placeholder="مثال: ۱۰۰۰"
                disabled={form.formState.isSubmitting}
              />
              <FormInput
                control={form.control}
                name="fleetSize"
                label="تعداد ناوگان"
                type="number"
                placeholder="مثال: ۵"
                disabled={form.formState.isSubmitting}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormCheckbox
                control={form.control}
                name="hasColdStorage"
                label="دارای سردخانه"
                disabled={form.formState.isSubmitting}
              />
              <FormInput
                control={form.control}
                name="serviceRadius"
                label="شعاع سرویس (کیلومتر)"
                type="number"
                placeholder="مثال: ۵۰"
                disabled={form.formState.isSubmitting}
              />
            </div>
          </FormSection>

          <div className="sticky bottom-0 z-10 bg-[rgba(5,6,15,0.85)] backdrop-blur-xl border border-steel-border/15 rounded-xl p-4 flex items-center justify-end gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
            <Link href="/admin/units">
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
                "ایجاد واحد"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
