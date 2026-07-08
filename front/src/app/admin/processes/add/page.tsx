"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSection } from "@/components/form/form-section";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Form } from "@/components/ui/form";
import { ProcessBuilder } from "@/components/process/process-builder";
import { add as addProcess } from "@/app/actions/process/add";
import { add as addStep } from "@/app/actions/processStep/add";
import { gets as getOrgs } from "@/app/actions/organization/gets";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

const assigneeGroupSchema = z.object({
  operator: z.string(),
  unitId: z.string().optional(),
});

const stepSchema = z.object({
  name: z.string().min(1, "نام گام الزامی است"),
  description: z.string().optional(),
  stepType: z.string(),
  order: z.number(),
  required: z.boolean(),
  groupsOperator: z.string(),
  assigneeGroups: z.array(assigneeGroupSchema),
});

const processSchema = z.object({
  name: z.string().min(1, "نام فرآیند الزامی است"),
  description: z.string().optional(),
  organizationId: z.string().min(1, "سازمان الزامی است"),
  steps: z.array(stepSchema),
});

type ProcessData = z.input<typeof processSchema>;

export default function AddProcessPage() {
  const router = useRouter();
  const form = useForm<ProcessData>({
    resolver: zodV4Resolver(processSchema),
    defaultValues: {
      name: "",
      description: "",
      organizationId: "",
      steps: [],
    },
  });

  const onSubmit = async (data: ProcessData) => {
    const result = await addProcess(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        name: data.name,
        description: data.description || undefined,
        status: "Draft",
        version: 1,
        isActive: true,
        organizationId: data.organizationId,
      },
      { _id: 1, name: 1 }
    );

    if (!result.success) {
      toast.error(result.body?.message || "خطا در ایجاد فرآیند");
      return;
    }

    const processId = result.body?._id;
    if (!processId) {
      toast.error("شناسه فرآیند دریافت نشد");
      return;
    }

    if (data.steps.length > 0) {
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        const assigneeGroups = step.assigneeGroups
          .filter((g) => g.unitId)
          .map((g) => ({
            operator: g.operator as "AND" | "OR",
            unitIds: [g.unitId as string],
          }));

        const stepResult = await addStep(
          {
            activeRoleId: getActiveRoleIdFromStore(),
            name: step.name,
            description: step.description || undefined,
            stepType: step.stepType as "Approval" | "Review" | "Notification" | "Action" | "Delivery" | "Receipt" | "Payment",
            order: i + 1,
            required: step.required,
            groupsOperator: step.groupsOperator as "AND" | "OR",
            assigneeGroups: assigneeGroups.length > 0 ? assigneeGroups : [{ operator: "AND", unitIds: [] }],
            processId,
          },
          { _id: 1, name: 1 }
        );

        if (!stepResult.success) {
          toast.error(`خطا در ایجاد گام ${i + 1}: ${stepResult.body?.message || "خطا"}`);
          return;
        }
      }
    }

    toast.success("فرآیند با موفقیت ایجاد شد");
    router.push("/admin/processes");
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="space-y-4">
        <Breadcrumbs />
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 border border-electric-iris/20">
            <Workflow className="size-5 text-electric-iris" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-heading-sm font-medium text-glacier tracking-tight leading-tight">
              فرآیند جدید
            </h1>
            <p className="text-body-sm text-fog/70 leading-relaxed">
              ایجاد فرآیند خرید جدید. گام‌های فرآیند را به ترتیب تعریف کنید.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormSection
            title="اطلاعات فرآیند"
            description="نام، توضیحات و سازمان مرتبط"
          >
            <FormSearchSelect
              control={form.control}
              name="organizationId"
              label="سازمان"
              placeholder="انتخاب سازمان..."
              required
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
            <FormInput
              control={form.control}
              name="name"
              label="نام فرآیند"
              placeholder="مثال: فرآیند خرید مستقیم"
              required
              disabled={form.formState.isSubmitting}
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              placeholder="توضیحات مختصری درباره فرآیند..."
              rows={3}
              disabled={form.formState.isSubmitting}
            />
          </FormSection>

          <div className="space-y-4">
            <h2 className="text-heading-sm font-medium text-glacier tracking-tight leading-tight">
              گام‌های فرآیند
            </h2>
            <ProcessBuilder
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              control={form.control as any}
              disabled={form.formState.isSubmitting}
            />
          </div>

          <div className="sticky bottom-0 z-10 bg-[rgba(5,6,15,0.85)] backdrop-blur-xl border border-steel-border/15 rounded-xl p-4 flex items-center justify-end gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
            <Link href="/admin/processes">
              <Button type="button" variant="ghost" disabled={form.formState.isSubmitting}>
                انصراف
              </Button>
            </Link>
            <Button type="submit" disabled={form.formState.isSubmitting} className="gap-1.5 min-w-[140px]">
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال ایجاد...
                </>
              ) : (
                "ایجاد فرآیند"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
