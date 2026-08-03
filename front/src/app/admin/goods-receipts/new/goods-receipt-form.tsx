"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { ClipboardList, Plus, Trash2, ShoppingCart, Package, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { SectionCard } from "@/components/form/section-card";
import { EntityFormShell } from "@/components/admin/entity-form-shell";
import type { SearchSelectOption } from "@/components/form/form-search-select";
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
  receivedAtTime: z.string().optional(),
  purchasingRequestId: z.string().min(1, "انتخاب درخواست خرید الزامی است"),
  items: z.array(itemSchema).min(1, "حداقل یک آیتم کالا باید وارد شود"),
});

type GoodsReceiptData = z.infer<typeof goodsReceiptSchema>;

const purchasingRequestsFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getPurchasingRequests(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q || undefined },
    { _id: 1, title: 1 }
  );
  if (!result.success || !result.body) return [];
  return (result.body as { _id: string; title?: string }[]).map((p) => ({
    _id: p._id,
    name: p.title || "",
  }));
};

const wareModelsFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareModels(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q || undefined },
    { _id: 1, name: 1 }
  );
  if (!result.success || !result.body) return [];
  return (result.body as { _id: string; name?: string }[]).map((w) => ({
    _id: w._id,
    name: w.name || "",
  }));
};

export function GoodsReceiptForm() {
  const router = useRouter();

  const form = useForm<GoodsReceiptData>({
    resolver: zodV4Resolver(goodsReceiptSchema),
    defaultValues: {
      receiptNumber: "",
      description: "",
      notes: "",
      receivedAt: new Date().toISOString(),
      receivedAtTime: new Date().toTimeString().slice(0, 5),
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
    try {
      const [h, m] = (values.receivedAtTime || "00:00").split(":").map(Number)
      const receivedDate = new Date(values.receivedAt)
      receivedDate.setHours(h || 0, m || 0)
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          receiptNumber: values.receiptNumber,
          description: values.description || undefined,
          receivedAt: receivedDate,
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
    }
  };

  return (
    <EntityFormShell
      title="رسید کالا جدید"
      description="ثبت رسید کالای دریافتی از فروشنده و اقلام آن."
      backHref="/admin/goods-receipts"
      backLabel="بازگشت به رسیدها"
      submitLabel="ثبت رسید"
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={ClipboardList}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="مشخصات رسید"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormInput control={form.control} name="receiptNumber" label="شماره رسید" placeholder="مثال: GR-۰۰۱" required />
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <FormJalaliDatePicker control={form.control} name="receivedAt" label="تاریخ رسید" required />
            </div>
            <FormInput control={form.control} name="receivedAtTime" label="ساعت" type="time" />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={ShoppingCart}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="درخواست خرید"
        description="رسید به یک درخواست خرید متصل می‌شود."
      >
        <FormSearchSelect
          control={form.control}
          name="purchasingRequestId"
          label="درخواست خرید"
          placeholder="درخواست خرید را جستجو و انتخاب کنید…"
          fetcher={purchasingRequestsFetcher}
          required
        />
      </SectionCard>

      <SectionCard
        icon={Package}
        iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
        title="آیتم‌های کالا"
        description="کالاهای دریافت شده در این رسید را اضافه کنید."
      >
          <div className="space-y-4">
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
                    fetcher={wareModelsFetcher}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <FormInput control={form.control} name={`items.${index}.quantityReceived`} label="تعداد دریافت" type="number" required />
                    <FormInput control={form.control} name={`items.${index}.quantityAccepted`} label="قبول شده" type="number" required />
                    <FormInput control={form.control} name={`items.${index}.quantityRejected`} label="رد شده" type="number" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormInput control={form.control} name={`items.${index}.batchNo`} label="شماره بچ" placeholder="مثال: BATCH-۰۰۱" />
                  <FormJalaliDatePicker control={form.control} name={`items.${index}.expirationDate`} label="تاریخ انقضا" />
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
              <p className="text-center text-fog/50 py-4">هیچ کالایی اضافه نشده است. از دکمه «افزودن کالا» استفاده کنید.</p>
            )}
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
      </SectionCard>

      <SectionCard
        icon={StickyNote}
        iconClassName="bg-white/[0.03] text-fog ring-steel-border/20"
        title="توضیحات و یادداشت‌ها"
        description="اطلاعات تکمیلی رسید."
      >
        <FormTextarea control={form.control} name="description" label="توضیحات" rows={2} />
        <FormTextarea control={form.control} name="notes" label="یادداشت‌ها" rows={2} />
      </SectionCard>
    </EntityFormShell>
  );
}
