"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Loader2, Save, Send, ShoppingCart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { add } from "@/app/actions/purchasingRequest/add";
import { submit } from "@/app/actions/purchasingRequest/submit";
import { gets as getWareModels } from "@/app/actions/wareModel/gets";

const newPRSchema = z.object({
  title: z.string().min(1, "عنوان درخواست الزامی است"),
  description: z.string().optional(),
  quantity: z.string().min(1, "تعداد الزامی است"),
  wareModelId: z.string().min(1, "انتخاب مدل کالا الزامی است"),
});

type NewPRData = z.input<typeof newPRSchema>;

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
    setSaving(true);
    try {
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
    } catch {
      toast.error("خطا در ذخیره پیش‌نویس");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSubmit = async (values: NewPRData) => {
    setSaving(true);
    try {
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
      if (!result.success || !result.body?._id) {
        toast.error(result.body?.message || "خطا در ایجاد درخواست خرید");
        setSaving(false);
        return;
      }
      const draftId = result.body._id;
      const submitResult = await submit(
        { activeRoleId: getActiveRoleIdFromStore(), _id: draftId },
        { _id: 1, title: 1, status: 1 }
      );
      if (submitResult.success) {
        toast.success("درخواست خرید با موفقیت ثبت و ارسال شد.");
        router.push(`/admin/purchasing-requests/${draftId}`);
      } else {
        toast.error(submitResult.body?.message || "پیش‌نویس ذخیره شد اما ارسال ناموفق بود");
        router.push(`/admin/purchasing-requests/${draftId}`);
      }
    } catch {
      toast.error("خطا در ثبت درخواست خرید");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6 relative z-[1]">
        {/* Basic Info */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                <FileText className="size-4.5 text-electric-iris" />
              </div>
              <div>
                <CardTitle>اطلاعات اولیه</CardTitle>
                <CardDescription>عنوان، توضیحات و تعداد درخواست</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormInput
              control={form.control}
              name="title"
              label="عنوان درخواست"
              placeholder="مثال: خرید تجهیزات اداری"
              required
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              placeholder="توضیحات تکمیلی..."
              rows={3}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                control={form.control}
                name="quantity"
                label="تعداد"
                placeholder="۱"
                type="number"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                <ShoppingCart className="size-4.5 text-electric-iris" />
              </div>
              <div>
                <CardTitle>کالا</CardTitle>
                <CardDescription>انتخاب مدل کالا برای خرید</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormSearchSelect
              control={form.control}
              name="wareModelId"
              label="مدل کالا"
              placeholder="جستجوی مدل کالا..."
              required
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
          </CardContent>
        </Card>

        {/* Unit Note */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-steel-border/30">
          <p className="text-xs text-fog/50">
            فرآیند تأیید به‌صورت خودکار بر اساس کالا و واحد درخواست‌کننده انتخاب می‌شود.
            واحد درخواست‌کننده به‌صورت پیش‌فرض از نقش فعال شما استفاده می‌شود.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="button" disabled={saving} className="gap-2 min-w-[160px]" onClick={form.handleSubmit(handleSaveAndSubmit)}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {saving ? "در حال ثبت..." : "ثبت و ارسال"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            className="gap-2"
            onClick={form.handleSubmit(handleSaveDraft)}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            ذخیره به عنوان پیش‌نویس
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            انصراف
          </Button>
        </div>
      </form>
    </Form>
  );
}
