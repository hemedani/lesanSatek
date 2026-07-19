"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Loader2, ClipboardList, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { add } from "@/app/actions/goodsReceipt/add";
import { gets as getPurchasingRequests } from "@/app/actions/purchasingRequest/gets";
import { gets as getWareModels } from "@/app/actions/wareModel/gets";

const itemSchema = z.object({
  wareModelId: z.string().min(1, "انتخاب مدل کالا الزامی است"),
  quantityReceived: z.coerce.number().min(1, "تعداد دریافت شده باید حداقل ۱ باشد"),
  quantityAccepted: z.coerce.number().min(0, "تعداد قبول شده نمی‌تواند منفی باشد"),
  quantityRejected: z.coerce.number().min(0, "تعداد رد شده نمی‌تواند منفی باشد"),
  batchNo: z.string().optional(),
  expirationDate: z.string().optional(),
});

const goodsReceiptSchema = z.object({
  receiptNumber: z.string().min(1, "شماره رسید الزامی است"),
  description: z.string().optional(),
  notes: z.string().optional(),
  receivedAt: z.string().min(1, "تاریخ رسید الزامی است"),
  purchasingRequestId: z.string().min(1, "انتخاب درخواست خرید الزامی است"),
  items: z.array(itemSchema).min(1, "حداقل یک آیتم کالا باید وارد شود"),
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
      items: [{
        wareModelId: "",
        quantityReceived: 1,
        quantityAccepted: 1,
        quantityRejected: 0,
        batchNo: "",
        expirationDate: "",
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items");

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
          items: values.items.map((item) => ({
            wareModelId: item.wareModelId,
            quantityReceived: item.quantityReceived,
            quantityAccepted: item.quantityAccepted,
            quantityRejected: item.quantityRejected,
            batchNo: item.batchNo || undefined,
            expirationDate: item.expirationDate ? new Date(item.expirationDate) : undefined,
          })),
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

        {/* Items Section */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <ClipboardList className="size-4.5 text-electric-iris" />
                </div>
                <div>
                  <CardTitle>آیتم‌های کالا</CardTitle>
                  <CardDescription>کالاهای دریافت شده در این رسید</CardDescription>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => append({ wareModelId: "", quantityReceived: 1, quantityAccepted: 1, quantityRejected: 0, batchNo: "", expirationDate: "" })}
                className="gap-1"
              >
                <Plus className="size-3.5" />
                افزودن کالا
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-lg border border-steel-border/20 bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-fog/50">کالای {index + 1}</span>
                  {index > 0 && (
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)} className="size-6 text-rose-400 hover:text-rose-300">
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormSearchSelect
                    control={form.control}
                    name={`items.${index}.wareModelId`}
                    label="مدل کالا"
                    placeholder="جستجوی کالا..."
                    required
                    fetcher={async (search?: string) => {
                      const result = await getWareModels(
                        { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                        { _id: 1, name: 1 }
                      );
                      if (!result.success || !result.body) return [];
                      return result.body.map((w: { _id?: string; name?: string }) => ({
                        _id: w._id || "",
                        name: w.name || "",
                      }));
                    }}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <FormInput control={form.control} name={`items.${index}.quantityReceived`} label="تعداد دریافت" type="number" required />
                    <FormInput control={form.control} name={`items.${index}.quantityAccepted`} label="قبول شده" type="number" required />
                    <FormInput control={form.control} name={`items.${index}.quantityRejected`} label="رد شده" type="number" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormInput control={form.control} name={`items.${index}.batchNo`} label="شماره بچ" placeholder="مثال: BATCH-۰۰۱" />
                  <FormInput control={form.control} name={`items.${index}.expirationDate`} label="تاریخ انقضا" type="date" />
                </div>
                {items?.[index] && (
                  <div className="flex items-center gap-4 text-xs text-fog/50">
                    <span>دریافتی: {items[index].quantityReceived || 0}</span>
                    <span>قبول: {items[index].quantityAccepted || 0}</span>
                    <span>رد: {items[index].quantityRejected || 0}</span>
                  </div>
                )}
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-center text-fog/50 py-4">هیچ کالایی اضافه نشده است. از دکمه "افزودن کالا" استفاده کنید.</p>
            )}
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
