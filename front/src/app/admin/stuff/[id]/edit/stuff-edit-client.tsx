"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Save, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker";
import { update } from "@/app/actions/stuff/update";
import { get as getWare } from "@/app/actions/ware/get";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import type { StuffDetail } from "../stuff-detail-client";

const stuffEditSchema = z.object({
  quantity: z.string().min(1, "تعداد الزامی است"),
  price: z.string().optional(),
  hasAbsolutePrice: z.enum(["absolute", "percentage"]),
  pricePercentage: z.string().optional(),
  expiration: z.string().optional(),
  barcode: z.string().optional(),
});

type StuffEditData = z.infer<typeof stuffEditSchema>;

export function StuffEditClient({ item }: { item: StuffDetail }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [wareBasePrice, setWareBasePrice] = useState(0);

  const form = useForm<StuffEditData>({
    resolver: zodV4Resolver(stuffEditSchema),
    defaultValues: {
      quantity: item.quantity?.toString() ?? "",
      price: item.price?.toString() ?? "",
      hasAbsolutePrice: item.hasAbsolutePrice === false ? "percentage" : "absolute",
      pricePercentage: item.pricePercentage?.toString() ?? "",
      expiration: item.expiration || "",
      barcode: item.barcode != null ? item.barcode.toString() : "",
    },
  });

  const pricingMode = form.watch("hasAbsolutePrice");
  const pricePercentage = form.watch("pricePercentage");

  const computedPrice =
    pricingMode === "percentage" && wareBasePrice > 0 && pricePercentage
      ? wareBasePrice * (1 + Number(pricePercentage) / 100)
      : Number(form.watch("price")) || 0;

  useEffect(() => {
    if (!item.ware?._id) return;
    getWare(
      { activeRoleId: getActiveRoleIdFromStore(), _id: item.ware._id },
      { _id: 1, price: 1 },
    ).then((res) => {
      if (res.success && res.body?.[0]) {
        setWareBasePrice(res.body[0].price || 0);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: StuffEditData) => {
    setSubmitting(true);
    try {
      const isAbsolute = pricingMode === "absolute";
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: item._id,
          quantity: Number(data.quantity) || 0,
          price: isAbsolute ? Number(data.price) || 0 : Math.round(computedPrice),
          hasAbsolutePrice: isAbsolute,
          pricePercentage: !isAbsolute && data.pricePercentage ? Number(data.pricePercentage) : undefined,
          expiration: data.expiration ? new Date(data.expiration) : undefined,
          barcode: data.barcode ? Number(data.barcode) : undefined,
          isBarcodeSet: !!data.barcode,
        },
        { _id: 1, quantity: 1 }
      );
      if (result.success) {
        toast.success("موجودی با موفقیت به‌روزرسانی شد");
        router.push(`/admin/stuff/${item._id}`);
        router.refresh();
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی موجودی");
      }
    } catch {
      toast.error("خطا در به‌روزرسانی موجودی");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/admin/stuff/${item._id}`)} className="rounded-lg">
          <ArrowRight className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-moonlight tracking-tight">ویرایش موجودی</h1>
          <p className="text-sm text-fog mt-1">
            {item.ware?.name || "موجودی"} — {item.store?.name || ""}
          </p>
        </div>
      </div>

      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
              <Package className="size-4.5 text-electric-iris" />
            </div>
            <CardTitle className="text-base font-medium text-frost-link">ویرایش اطلاعات موجودی</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="rounded-lg border border-steel-border/15 bg-white/[0.02] p-4 space-y-1">
                <p className="text-xs text-fog/50">کالا</p>
                <p className="text-sm font-medium text-moonlight">{item.ware?.name || "—"}</p>
                {item.ware?.brand && <p className="text-xs text-fog/60">برند: {item.ware.brand}</p>}
              </div>

              <FormInput control={form.control} name="quantity" label="تعداد" type="number" placeholder="۰" required disabled={submitting} />

              <div className="space-y-3 rounded-lg border border-steel-border/15 bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-moonlight">نحوه قیمت‌گذاری</p>
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={pricingMode === "absolute"}
                      onChange={() => form.setValue("hasAbsolutePrice", "absolute")}
                      className="size-4 accent-electric-iris"
                    />
                    <span className="text-sm text-fog">قیمت مطلق</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      checked={pricingMode === "percentage"}
                      onChange={() => form.setValue("hasAbsolutePrice", "percentage")}
                      className="size-4 accent-electric-iris"
                    />
                    <span className="text-sm text-fog">درصد افزایش</span>
                  </label>
                </div>

                {pricingMode === "absolute" ? (
                  <FormInput control={form.control} name="price" label="قیمت نهایی (ریال)" type="number" placeholder="۲۸۰۰۰۰۰" required disabled={submitting} />
                ) : (
                  <div className="space-y-2">
                    <FormInput control={form.control} name="pricePercentage" label="درصد افزایش" type="number" placeholder="۱۵" disabled={submitting} />
                    <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-fog/70">قیمت محاسبه‌شده</span>
                        <span className="font-mono text-emerald-400" dir="ltr">
                          {computedPrice > 0 ? `${computedPrice.toLocaleString("fa-IR")} ریال` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormJalaliDatePicker control={form.control} name="expiration" label="تاریخ انقضا" disabled={submitting} />
                <FormInput control={form.control} name="barcode" label="بارکد" type="number" placeholder="مثال: ۱۲۳۴۵۶" disabled={submitting} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1 gap-2">
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  <Save className="size-4" />
                  {submitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push(`/admin/stuff/${item._id}`)} disabled={submitting}>
                  انصراف
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}