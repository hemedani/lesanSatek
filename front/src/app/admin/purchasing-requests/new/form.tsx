"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Loader2, Save, ShoppingCart, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { HelpLauncher } from "@/components/help/help-launcher";
import { SectionCard } from "@/components/form/section-card";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { add } from "@/app/actions/purchasingRequest/add";
import { gets as getWareModels } from "@/app/actions/wareModel/gets";

const newPRSchema = z.object({
  title: z.string().min(1, "عنوان درخواست الزامی است"),
  description: z.string().optional(),
  quantity: z.string().min(1, "تعداد الزامی است"),
  wareModelId: z.string().min(1, "انتخاب مدل کالا الزامی است"),
});

type NewPRData = z.infer<typeof newPRSchema>;

export function NewPurchasingRequestForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const form = useForm<NewPRData>({
    resolver: zodV4Resolver(newPRSchema),
    defaultValues: {
      title: "",
      description: "",
      quantity: "1",
      wareModelId: "",
    },
  });

  const handleSaveDraft = async (values: NewPRData) => {
    const result = await add(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        title: values.title,
        description: values.description || undefined,
        quantity: Number(values.quantity),
        wareModelId: values.wareModelId,
      },
      { _id: 1, title: 1, status: 1 }
    );
    if (result.success && result.body?._id) {
      toast.success("پیش‌نویس درخواست خرید ذخیره شد.");
      router.push(`/admin/purchasing-requests/${result.body._id}`);
    } else {
      toast.error(result.body?.message || "خطا در ذخیره پیش‌نویس");
    }
  };

  const submit = async (values: NewPRData) => {
    setSaving(true);
    try {
      await handleSaveDraft(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="درخواست خرید جدید"
        description="ثبت درخواست خرید به عنوان پیش‌نویس؛ پس از تعیین کالا یا مناقصه، توسط مدیر واحد ارسال می‌شود."
      >

        <Link href="/admin/purchasing-requests">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به درخواست‌ها
          </Button>
        </Link>
      <HelpLauncher topicId="admin-purchasing-requests" tooltip="راهنمای درخواست خرید جدید" />
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
          <SectionCard
            icon={FileText}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="اطلاعات اولیه"
            description="عنوان، توضیحات و تعداد درخواست"
          >
            <FormInput
              control={form.control}
              name="title"
              label="عنوان درخواست"
              placeholder="مثال: خرید تجهیزات اداری"
              required
              disabled={saving}
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              placeholder="توضیحات تکمیلی…"
              rows={3}
              disabled={saving}
            />
            <FormInput
              control={form.control}
              name="quantity"
              label="تعداد"
              placeholder="۱"
              type="number"
              required
              disabled={saving}
            />
          </SectionCard>

          <SectionCard
            icon={ShoppingCart}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="کالا"
            description="انتخاب مدل کالا برای خرید"
          >
            <FormSearchSelect
              control={form.control}
              name="wareModelId"
              label="مدل کالا"
              placeholder="مدل کالا را جستجو و انتخاب کنید…"
              required
              disabled={saving}
              fetcher={async (search?: string) => {
                const result = await getWareModels(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                  { _id: 1, name: 1, enName: 1 }
                );
                if (!result.success || !result.body) return [];
                return result.body.map((w: { _id?: string; name?: string; enName?: string }) => ({
                  _id: w._id || "",
                  name: w.name || "",
                  sublabel: w.enName || undefined,
                }));
              }}
            />
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] p-3 ring-1 ring-inset ring-steel-border/30">
              <p className="text-body-sm text-fog/60">
                فرآیند تأیید به‌صورت خودکار بر اساس کالا و واحد درخواست‌کننده انتخاب می‌شود. واحد
                درخواست‌کننده به‌صورت پیش‌فرض از نقش فعال شما استفاده می‌شود.
              </p>
            </div>
          </SectionCard>

          <div className="sticky bottom-0 z-10">
            <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <p className="hidden text-caption text-fog/60 sm:block">
                فیلدهای ستاره‌دار الزامی هستند
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={saving}
                  className="flex-1 gap-2 px-5 sm:flex-none"
                >
                  {saving ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Save className="size-5" />
                  )}
                  {saving ? "در حال ذخیره…" : "ثبت پیش‌نویس"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={saving}
                  onClick={() => router.back()}
                  className="gap-2 px-5"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}