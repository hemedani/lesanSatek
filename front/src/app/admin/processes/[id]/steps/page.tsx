"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { ProcessBuilder } from "@/components/process/process-builder";
import { get } from "@/app/actions/process/get";
import { add as addStep } from "@/app/actions/processStep/add";
import { update as updateStep } from "@/app/actions/processStep/update";
import { remove as removeStep } from "@/app/actions/processStep/remove";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

const stepSchema = z.object({
  name: z.string().min(1, "نام گام الزامی است"),
  description: z.string().optional(),
  stepType: z.string(),
  order: z.number(),
  required: z.boolean(),
  groupsOperator: z.string(),
  assigneeGroups: z.array(z.object({
    operator: z.string(),
    unitId: z.string().optional(),
  })),
});

const formSchema = z.object({
  steps: z.array(stepSchema),
});

type FormData = z.input<typeof formSchema>;

export default function EditProcessStepsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [processName, setProcessName] = useState("");
  const [originalSteps, setOriginalSteps] = useState<{ _id?: string }[]>([]);

  const form = useForm<FormData>({
    resolver: zodV4Resolver(formSchema),
    defaultValues: {
      steps: [],
    },
  });

  useEffect(() => {
    const load = async () => {
      const result = await get(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        {
          _id: 1,
          name: 1,
          steps: { _id: 1, name: 1, description: 1, stepType: 1, order: 1, required: 1, groupsOperator: 1, assigneeGroups: 1 },
        }
      );
      if (result.success && result.body?.[0]) {
        const p = result.body[0];
        setProcessName(p.name || "");
        const steps = (p.steps || []).sort((a: { order?: number }, b: { order?: number }) => (a.order || 0) - (b.order || 0));
        setOriginalSteps(steps);

        const mappedSteps = steps.map((s: { _id?: string; assigneeGroups?: { operator: string; unitIds?: string[] }[] }) => ({
          ...s,
          assigneeGroups: (s.assigneeGroups || []).map((g) => ({
            operator: g.operator,
            unitId: (g.unitIds || [])[0] || "",
          })),
        }));

        form.reset({ steps: mappedSteps });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [form, id]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    const activeRoleId = getActiveRoleIdFromStore();

    const existingIds = new Set(originalSteps.map((s) => s._id));
    const formIds = new Set(data.steps.map((s) => (s as { _id?: string })._id).filter(Boolean));
    const toRemove = originalSteps.filter((s) => s._id && !formIds.has(s._id));

    let hasError = false;

    for (const step of toRemove) {
      const result = await removeStep({ activeRoleId, _id: step._id! }, {});
      if (!result.success) {
        toast.error(`خطا در حذف گام "${step._id}": ${result.body?.message || "خطا"}`);
        hasError = true;
      }
    }

    for (let i = 0; i < data.steps.length; i++) {
      if (hasError) break;
      const step = data.steps[i];
      const assigneeGroups = step.assigneeGroups
        .filter((g) => g.unitId)
        .map((g) => ({
          operator: g.operator as "AND" | "OR",
          unitIds: [g.unitId as string],
        }));

      const stepPayload = {
        activeRoleId,
        name: step.name,
        description: step.description || undefined,
        stepType: step.stepType as "Approval" | "Review" | "Notification" | "Action" | "Delivery" | "Receipt" | "Payment",
        order: i + 1,
        required: step.required,
        groupsOperator: step.groupsOperator as "AND" | "OR",
        assigneeGroups: assigneeGroups.length > 0 ? assigneeGroups : [{ operator: "AND" as const, unitIds: [] as string[] }],
      };

      const stepId = (step as { _id?: string })._id;

      if (stepId && existingIds.has(stepId)) {
        const result = await updateStep(
          { ...stepPayload, _id: stepId } as Parameters<typeof updateStep>[0],
          { _id: 1 }
        );
        if (!result.success) {
          toast.error(`خطا در به‌روزرسانی گام "${step.name}": ${result.body?.message || "خطا"}`);
          hasError = true;
        }
      } else if (!stepId) {
        const result = await addStep(
          { ...stepPayload, processId: id },
          { _id: 1 }
        );
        if (!result.success) {
          toast.error(`خطا در ایجاد گام "${step.name}": ${result.body?.message || "خطا"}`);
          hasError = true;
        }
      }
    }

    setSaving(false);

    if (!hasError) {
      toast.success("گام‌ها با موفقیت ذخیره شدند");
      router.refresh();
      router.push("/admin/processes");
    }
  };

  if (loading) {
    return <LoadingSkeleton type="card" count={1} />;
  }

  if (notFound) {
    return (
      <div>
        <ErrorState
          title="فرآیند مورد نظر یافت نشد"
          message="فرآیندی با این شناسه در سامانه وجود ندارد."
        />
        <div className="flex justify-center mt-4">
          <Link href="/admin/processes">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/processes"
          className="text-fog hover:text-moonlight transition-colors"
        >
          <ArrowRight className="size-5" />
        </Link>
        <PageHeader
          title={`گام‌های فرآیند: ${processName}`}
          description="افزودن، ویرایش و مرتب‌سازی گام‌های فرآیند"
          className="border-none mb-0 pb-0"
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <ProcessBuilder control={form.control as any} />

          <div className="flex items-center gap-2 justify-end sticky bottom-0 py-4 bg-[#05060f] border-t border-steel-border/10">
            <Link href="/admin/processes">
              <Button type="button" variant="outline" size="sm">
                انصراف
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="size-4 animate-spin" />}
              <Save className="size-4" />
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
