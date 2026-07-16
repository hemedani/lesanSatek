"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Loader2, Send, ShoppingCart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { submit } from "@/app/actions/purchasingRequest/submit";
import { gets as getWareModels } from "@/app/actions/wareModel/gets";

const newPRSchema = z.object({
  title: z.string().min(1, "عنوان درخواست الزامی است"),
  description: z.string().optional(),
  estimatedAmount: z.string().optional(),
  quantity: z.string().min(1, "تعداد الزامی است"),
  wareModelId: z.string().min(1, "انتخاب مدل کالا الزامی است"),
  requestingUnitId: z.string().optional(),
});

type NewPRData = z.input<typeof newPRSchema>;

export function NewPurchasingRequestForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<NewPRData>({
    resolver: zodV4Resolver(newPRSchema),
    defaultValues: {
      title: "",
      description: "",
      estimatedAmount: "",
      quantity: "1",
      wareModelId: "",
      requestingUnitId: "",
    },
  });

  const onSubmit = async (values: NewPRData) => {
    setSubmitting(true);
    try {
      const result = await submit(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          title: values.title,
          description: values.description || undefined,
          estimatedAmount: values.estimatedAmount ? Number(values.estimatedAmount) : undefined,
          quantity: Number(values.quantity),
          wareModelId: values.wareModelId,
          requestingUnitId: values.requestingUnitId || undefined,
        },
        { _id: 1, title: 1, status: 1 }
      );
      if (result.success && result.body?.[0]?._id) {
        toast.success("درخواست خرید با موفقیت ثبت شد.");
        router.push(`/admin/purchasing-requests/${result.body[0]._id}`);
      } else {
        toast.error(result.body?.message || "خطا در ثبت درخواست خرید");
      }
    } catch {
      toast.error("خطا در ثبت درخواست خرید");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-[1]">
        {/* Basic Info */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                <FileText className="size-4.5 text-electric-iris" />
              </div>
              <div>
                <CardTitle>اطلاعات اولیه</CardTitle>
                <CardDescription>عنوان، توضیحات و مبلغ تخمینی درخواست</CardDescription>
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
                name="estimatedAmount"
                label="مبلغ تخمینی (ریال)"
                placeholder="مثال: ۵۰۰۰۰۰۰۰۰"
                type="number"
              />
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
          <Button type="submit" disabled={submitting} className="gap-2 min-w-[160px]">
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {submitting ? "در حال ثبت..." : "ثبت و ارسال درخواست"}
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
