"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, Trash2, Workflow, Copy, CheckCircle2, Share2, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormCard } from "@/components/form/form-card";
import { PageHeader } from "@/components/ui/page-header";
import { Form } from "@/components/ui/form";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { get } from "@/app/actions/process/get";
import { update } from "@/app/actions/process/update";
import { remove } from "@/app/actions/process/remove";
import { activateProcess } from "@/app/actions/process/activateProcess";
import { duplicateProcess } from "@/app/actions/process/duplicateProcess";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

const processSchema = z.object({
  name: z.string().min(1, "نام فرآیند الزامی است"),
  description: z.string().optional(),
});

type ProcessData = z.input<typeof processSchema>;

const statusLabels: Record<string, { label: string; variant: "active" | "inactive" | "pending" | "info" }> = {
  Draft: { label: "پیش‌نویس", variant: "inactive" },
  Active: { label: "فعال", variant: "active" },
  Archived: { label: "بایگانی", variant: "pending" },
};

const stepTypeLabels: Record<string, string> = {
  Approval: "تصویب",
  Review: "بررسی",
  Notification: "اطلاع‌رسانی",
  Action: "اقدام",
  Delivery: "تحویل",
  Receipt: "دریافت",
  Payment: "پرداخت",
};

export default function EditProcessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [process, setProcess] = useState<any>(null);

  const form = useForm<ProcessData>({
    resolver: zodV4Resolver(processSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    const load = async () => {
      const result = await get(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        {
          _id: 1,
          name: 1,
          description: 1,
          status: 1,
          version: 1,
          isActive: 1,
          createdAt: 1,
          organization: { _id: 1, name: 1 },
          createdBy: { _id: 1, first_name: 1, last_name: 1 },
          unit: { _id: 1, name: 1 },
          wareType: { _id: 1, name: 1 },
          wareClass: { _id: 1, name: 1 },
          wareGroup: { _id: 1, name: 1 },
          wareModel: { _id: 1, name: 1 },
          ware: { _id: 1, name: 1 },
          steps: { _id: 1, name: 1, description: 1, stepType: 1, order: 1, required: 1, groupsOperator: 1 },
        }
      );
      if (result.success && result.body?.[0]) {
        const p = result.body[0];
        setProcess(p);
        form.reset({
          name: p.name || "",
          description: p.description || "",
        });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [form, id]);

  const onSubmit = async (data: ProcessData) => {
    const result = await update(
      { activeRoleId: getActiveRoleIdFromStore(), _id: id, name: data.name, description: data.description || undefined },
      { _id: 1, name: 1 }
    );
    if (result.success) {
      toast.success("فرآیند با موفقیت به‌روزرسانی شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در به‌روزرسانی فرآیند");
    }
  };

  const handleDelete = async () => {
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: id });
    if (result.success) {
      toast.success("فرآیند با موفقیت حذف شد");
      router.push("/admin/processes");
    } else {
      toast.error(result.body?.message || "خطا در حذف فرآیند");
    }
    setShowDelete(false);
  };

  const handleActivate = async () => {
    const result = await activateProcess({ activeRoleId: getActiveRoleIdFromStore(), _id: id });
    if (result.success) {
      toast.success("فرآیند با موفقیت فعال شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در فعال‌سازی فرآیند");
    }
  };

  const handleDuplicate = async () => {
    const name = `${process?.name || "فرآیند"} (کپی)`;
    const result = await duplicateProcess({ activeRoleId: getActiveRoleIdFromStore(), _id: id, name });
    if (result.success) {
      toast.success("فرآیند با موفقیت کپی شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در کپی فرآیند");
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steps = (process?.steps || []).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/processes"
            className="text-fog hover:text-moonlight transition-colors"
          >
            <ArrowRight className="size-5" />
          </Link>
          <PageHeader
            title={process?.name || "ویرایش فرآیند"}
            description={`نسخه ${process?.version || 1}`}
            className="border-none mb-0 pb-0"
          />
        </div>
        <div className="flex items-center gap-2">
          {process?.status === "Draft" && (
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-400 gap-1.5"
              onClick={handleActivate}
            >
              <CheckCircle2 className="size-4" />
              فعال‌سازی
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-frost-link gap-1.5"
            onClick={handleDuplicate}
          >
            <Copy className="size-4" />
            کپی
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive gap-1.5"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="size-4" />
            حذف
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 px-1 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fog/60">وضعیت:</span>
          {process?.status && (
            <StatusBadge
              status={statusLabels[process.status]?.variant || "inactive"}
              label={statusLabels[process.status]?.label || process.status}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-fog/60">فعالیت:</span>
          <StatusBadge
            status={process?.isActive ? "active" : "inactive"}
            label={process?.isActive ? "فعال" : "غیرفعال"}
          />
        </div>
        {process?.organization && (
          <span className="text-xs text-fog/50">{process.organization.name}</span>
        )}
      </div>

      {/* Scope Info */}
      <div className="rounded-xl border border-steel-border/20 bg-white/[0.02] p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Target className="size-4 text-electric-iris" />
          <span className="text-xs font-medium text-fog/70">حوزه کاربرد</span>
        </div>
        {(process?.unit || process?.wareType || process?.wareClass || process?.wareGroup || process?.wareModel || process?.ware) ? (
          <div className="flex flex-wrap gap-2">
            {process?.unit && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-electric-iris/8 text-electric-iris/80 border border-electric-iris/15">
                واحد: {process.unit.name}
              </span>
            )}
            {process?.wareType && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-frost-link/8 text-frost-link/80 border border-frost-link/15">
                نوع کالا: {process.wareType.name}
              </span>
            )}
            {process?.wareClass && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-amber-400/8 text-amber-400/80 border border-amber-400/15">
                رده کالا: {process.wareClass.name}
              </span>
            )}
            {process?.wareGroup && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-400/8 text-emerald-400/80 border border-emerald-400/15">
                گروه کالا: {process.wareGroup.name}
              </span>
            )}
            {process?.wareModel && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-fog/8 text-fog/80 border border-fog/15">
                مدل کالا: {process.wareModel.name}
              </span>
            )}
            {process?.ware && (
              <span className="text-[11px] px-2 py-1 rounded-full bg-fog/8 text-fog/80 border border-fog/15">
                کالا: {process.ware.name}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-fog/50">فرآیند عمومی سازمان — محدود به حوزه خاصی نیست</p>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormCard title="اطلاعات فرآیند">
            <FormInput
              control={form.control}
              name="name"
              label="نام فرآیند"
              required
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              rows={3}
            />
          </FormCard>

          <div className="flex items-center gap-2 justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting} className="gap-1.5">
              {form.formState.isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </Form>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Workflow className="size-5 text-electric-iris" />
          <h2 className="text-base font-medium text-glacier">گام‌های فرآیند</h2>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-electric-iris/8 text-electric-iris/70">
            {steps.length} گام
          </span>
        </div>

        {steps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-steel-border/20 p-8 text-center">
            <Workflow className="size-8 text-fog/30 mx-auto mb-2" />
            <p className="text-sm text-fog/60">هیچ گامی تعریف نشده است</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {steps.map((step: any, idx: number) => (
              <div
                key={step._id || idx}
                className="relative flex items-start gap-4 rounded-lg border border-steel-border/20 bg-white/[0.02] p-4 transition-all duration-200 hover:bg-white/[0.04]"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="flex items-center justify-center size-7 rounded-full bg-electric-iris/10 text-electric-iris text-xs font-semibold">
                    {idx + 1}
                  </span>
                  {idx < steps.length - 1 && (
                    <div className="w-px flex-1 min-h-[12px] bg-steel-border/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-moonlight">{step.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-fog/60 border border-steel-border/20">
                      {stepTypeLabels[step.stepType] || step.stepType}
                    </span>
                    {step.required && (
                      <span className="text-[10px] text-amber-400/70">ضروری</span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-xs text-fog/50 mt-1">{step.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-fog/40">
                      عملگر: {step.groupsOperator === "AND" ? "همه گروه‌ها" : "یکی از گروه‌ها"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        <Link href={`/admin/processes/${id}/graph`}>
          <Button type="button" variant="outline" className="gap-2">
            <BarChart3 className="size-4" />
            نمودار فرآیند
          </Button>
        </Link>
        <Link href={`/admin/processes/${id}/relations`}>
          <Button type="button" variant="outline" className="gap-2">
            <Share2 className="size-4" />
            ویرایش روابط
          </Button>
        </Link>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف فرآیند"
        description="آیا از حذف این فرآیند اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </div>
  );
}
