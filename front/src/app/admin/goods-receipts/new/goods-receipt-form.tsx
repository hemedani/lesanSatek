"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Loader2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { add } from "@/app/actions/goodsReceipt/add";
import { gets as getPurchasingRequests } from "@/app/actions/purchasingRequest/gets";

const goodsReceiptSchema = z.object({
  receiptNumber: z.string().min(1, "شماره رسید الزامی است"),
  description: z.string().optional(),
  notes: z.string().optional(),
  receivedAt: z.string().min(1, "تاریخ رسید الزامی است"),
  purchasingRequestId: z.string().min(1, "انتخاب درخواست خرید الزامی است"),
});

type GoodsReceiptData = z.input<typeof goodsReceiptSchema>;

export function GoodsReceiptForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<GoodsReceiptData>({
    resolver: zodV4Resolver(goodsReceiptSchema),
    defaultValues: {
      receiptNumber: "",
      description: "",
      notes: "",
      receivedAt: new Date().toISOString().slice(0, 16),
      purchasingRequestId: "",
    },
  });

  const onSubmit = async (values: GoodsReceiptData) => {
    setSubmitting(true);
    try {
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          receiptNumber: values.receiptNumber,
          description: values.description || undefined,
          receivedAt: new Date(values.receivedAt),
          status: "pending",
          notes: values.notes || undefined,
          items: [],
          purchasingRequestId: values.purchasingRequestId,
          receivedById: "",
          receivingUnitId: "",
        },
        { _id: 1, receiptNumber: 1, status: 1 }
      );
      if (result.success) {
        toast.success("رسید کالا با موفقیت ثبت شد.");
        router.push("/admin/goods-receipts");
      } else {
        toast.error(result.body?.message || "خطا در ثبت رسید کالا");
      }
    } catch {
      toast.error("خطا در ثبت رسید کالا");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-[1]">
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                <ClipboardList className="size-4.5 text-electric-iris" />
              </div>
              <div>
                <CardTitle>رسید کالا جدید</CardTitle>
                <CardDescription>ثبت رسید کالای دریافتی</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput control={form.control} name="receiptNumber" label="شماره رسید" placeholder="مثال: GR-۰۰۱" required />
              <FormInput control={form.control} name="receivedAt" label="تاریخ رسید" type="datetime-local" required />
            </div>
            <FormSearchSelect
              control={form.control}
              name="purchasingRequestId"
              label="درخواست خرید"
              placeholder="جستجوی درخواست خرید..."
              required
              fetcher={async (search?: string) => {
                const result = await getPurchasingRequests(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                  { _id: 1, title: 1 }
                );
                if (!result.success || !result.body) return [];
                return result.body.map((p: { _id?: string; title?: string }) => ({
                  _id: p._id || "",
                  name: p.title || "",
                }));
              }}
            />
            <FormTextarea control={form.control} name="description" label="توضیحات" rows={2} />
            <FormTextarea control={form.control} name="notes" label="یادداشت‌ها" rows={2} />
          </CardContent>
        </Card>
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={submitting} className="gap-2 min-w-[160px]">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ClipboardList className="size-4" />}
            {submitting ? "در حال ثبت..." : "ثبت رسید"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>انصراف</Button>
        </div>
      </form>
    </Form>
  );
}
