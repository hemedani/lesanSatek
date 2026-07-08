"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Loader2, Save, Store, Banknote, MapPin, BadgeInfo, Shield, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { get } from "@/app/actions/store/get";
import { update } from "@/app/actions/store/update";
import { remove } from "@/app/actions/store/remove";

const storeSchema = z.object({
  name: z.string().min(1, "نام فروشگاه الزامی است"),
  address: z.string().optional(),
  contact: z.string().optional(),
  ceoname: z.string().optional(),
  workingHours: z.string().optional(),
  email: z.string().optional(),
  economicCode: z.string().optional(),
  postalCode: z.string().optional(),
  nationalId: z.string().optional(),
  registerNumber: z.string().optional(),
  certificateNumber: z.string().optional(),
  legalPerson: z.string().optional(),
  bankCardNumber: z.string().optional(),
  shebaNumber: z.string().optional(),
  nameOfAccountHolder: z.string().optional(),
  bankName: z.string().optional(),
  fastDelivery: z.boolean().default(false),
  isAvailableInHolidays: z.boolean().default(false),
  score: z.string().default("0"),
  status: z.string().min(1, "وضعیت الزامی است"),
});

type StoreData = z.input<typeof storeSchema>;

export default function EditStorePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<StoreData>({
    resolver: zodV4Resolver(storeSchema),
    defaultValues: {
      name: "",
      address: "",
      contact: "",
      ceoname: "",
      workingHours: "",
      email: "",
      economicCode: "",
      postalCode: "",
      nationalId: "",
      registerNumber: "",
      certificateNumber: "",
      legalPerson: "",
      bankCardNumber: "",
      shebaNumber: "",
      nameOfAccountHolder: "",
      bankName: "",
      fastDelivery: false,
      isAvailableInHolidays: false,
      score: "0",
      status: "Active",
    },
  });

  useEffect(() => {
    (async () => {
      const result = await get({ _id: id }, {
        _id: 1, name: 1, address: 1, contact: 1, ceoname: 1,
        workingHours: 1, email: 1, economicCode: 1, postalCode: 1,
        nationalId: 1, registerNumber: 1, certificateNumber: 1,
        legalPerson: 1, bankCardNumber: 1, shebaNumber: 1,
        nameOfAccountHolder: 1, bankName: 1, fastDelivery: 1,
        isAvailableInHolidays: 1, score: 1, status: 1,
      });
      if (result.success && result.body?.[0]) {
        const s = result.body[0];
        form.reset({
          name: s.name || "",
          address: s.address || "",
          contact: s.contact || "",
          ceoname: s.ceoname || "",
          workingHours: s.workingHours || "",
          email: s.email || "",
          economicCode: s.economicCode || "",
          postalCode: s.postalCode || "",
          nationalId: s.nationalId || "",
          registerNumber: s.registerNumber || "",
          certificateNumber: s.certificateNumber || "",
          legalPerson: s.legalPerson || "",
          bankCardNumber: s.bankCardNumber || "",
          shebaNumber: s.shebaNumber || "",
          nameOfAccountHolder: s.nameOfAccountHolder || "",
          bankName: s.bankName || "",
          fastDelivery: s.fastDelivery ?? false,
          isAvailableInHolidays: s.isAvailableInHolidays ?? false,
          score: String(s.score ?? 0),
          status: s.status || "Active",
        });
      } else {
        toast.error("فروشگاه یافت نشد");
        router.push("/admin/stores");
      }
      setLoading(false);
    })();
  }, [id, form, router]);

  const onSubmit = async (values: StoreData) => {
    setSubmitting(true);
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: id,
          name: values.name,
          address: values.address || undefined,
          contact: values.contact || undefined,
          ceoname: values.ceoname || undefined,
          workingHours: values.workingHours || undefined,
          email: values.email || undefined,
          economicCode: values.economicCode || undefined,
          postalCode: values.postalCode || undefined,
          nationalId: values.nationalId || undefined,
          registerNumber: values.registerNumber || undefined,
          certificateNumber: values.certificateNumber || undefined,
          legalPerson: values.legalPerson || undefined,
          bankCardNumber: values.bankCardNumber || undefined,
          shebaNumber: values.shebaNumber || undefined,
          nameOfAccountHolder: values.nameOfAccountHolder || undefined,
          bankName: values.bankName || undefined,
          fastDelivery: values.fastDelivery,
          isAvailableInHolidays: values.isAvailableInHolidays,
          score: Number(values.score),
          status: values.status,
        },
        { _id: 1, name: 1 }
      );
      if (result.success) {
        toast.success("فروشگاه با موفقیت به‌روزرسانی شد.");
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی فروشگاه");
      }
    } catch {
      toast.error("خطا در به‌روزرسانی فروشگاه");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: id }, { _id: 1 });
      if (result.success) {
        toast.success("فروشگاه حذف شد.");
        router.push("/admin/stores");
      } else {
        toast.error(result.body?.message || "خطا در حذف فروشگاه");
      }
    } catch {
      toast.error("خطا در حذف فروشگاه");
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <div className="flex items-center justify-between pb-4 border-b border-steel-border/50">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => router.push("/admin/stores")} className="rounded-lg">
              <ArrowRight className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-moonlight tracking-tight">ویرایش فروشگاه</h1>
              <p className="text-sm text-fog/60 mt-1">به‌روزرسانی اطلاعات فروشگاه</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => setShowDelete(true)}>
            <Trash2 className="size-4" /> حذف
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-[1]">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Store className="size-4.5 text-electric-iris" />
                </div>
                <div>
                  <CardTitle>اطلاعات فروشگاه</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput control={form.control} name="name" label="نام فروشگاه" required />
                <FormInput control={form.control} name="ceoname" label="نام مدیر" />
              </div>
              <FormTextarea control={form.control} name="address" label="آدرس" rows={2} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput control={form.control} name="contact" label="تلفن تماس" />
                <FormInput control={form.control} name="email" label="ایمیل" />
                <FormInput control={form.control} name="workingHours" label="ساعات کاری" />
                <FormSelect
                  control={form.control}
                  name="status"
                  label="وضعیت"
                  placeholder="انتخاب وضعیت"
                  options={[
                    { value: "Active", label: "فعال" },
                    { value: "Inactive", label: "غیرفعال" },
                    { value: "Suspended", label: "تعلیق شده" },
                    { value: "Blacklisted", label: "مسدود" },
                  ]}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <BadgeInfo className="size-4.5 text-electric-iris" />
                </div>
                <div><CardTitle>مشخصات حقوقی</CardTitle></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput control={form.control} name="economicCode" label="کد اقتصادی" />
                <FormInput control={form.control} name="nationalId" label="شناسه ملی" />
                <FormInput control={form.control} name="registerNumber" label="شماره ثبت" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput control={form.control} name="legalPerson" label="شخص حقوقی" />
                <FormInput control={form.control} name="certificateNumber" label="شماره گواهی" />
                <FormInput control={form.control} name="postalCode" label="کد پستی" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Banknote className="size-4.5 text-electric-iris" />
                </div>
                <div><CardTitle>اطلاعات بانکی</CardTitle></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput control={form.control} name="bankCardNumber" label="شماره کارت" />
                <FormInput control={form.control} name="shebaNumber" label="شماره شبا" />
                <FormInput control={form.control} name="nameOfAccountHolder" label="نام صاحب حساب" />
                <FormInput control={form.control} name="bankName" label="نام بانک" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Shield className="size-4.5 text-electric-iris" />
                </div>
                <div><CardTitle>تنظیمات</CardTitle></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput control={form.control} name="score" label="امتیاز" type="number" />
                <FormCheckbox control={form.control} name="fastDelivery" label="تحویل سریع" />
                <FormCheckbox control={form.control} name="isAvailableInHolidays" label="فعال در تعطیلات" />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="gap-2 min-w-[160px]">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {submitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف فروشگاه"
        description="آیا از حذف این فروشگاه اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmLabel={deleting ? "در حال حذف..." : "حذف"}
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
