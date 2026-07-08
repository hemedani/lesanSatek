"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Loader2, Plus, Store, Banknote, MapPin, BadgeInfo, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormSearchSelect } from "@/components/form/form-search-select";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { add } from "@/app/actions/store/add";
import { gets as getStates } from "@/app/actions/state/gets";
import { gets as getCities } from "@/app/actions/city/gets";

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
  stateId: z.string().optional(),
  cityId: z.string().optional(),
});

type StoreData = z.input<typeof storeSchema>;

export default function AddStorePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

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
      stateId: "",
      cityId: "",
    },
  });

  const onSubmit = async (values: StoreData) => {
    setSubmitting(true);
    try {
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
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
          totalSoldAmount: 0,
          totalSoldNum: 0,
          cityId: values.cityId || undefined,
          stateId: values.stateId || undefined,
        },
        { _id: 1, name: 1 }
      );
      if (result.success && result.body?.[0]?._id) {
        toast.success("فروشگاه با موفقیت ایجاد شد.");
        router.push(`/admin/stores/${result.body[0]._id}`);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد فروشگاه");
      }
    } catch {
      toast.error("خطا در ایجاد فروشگاه");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <div className="pb-4 border-b border-steel-border/50">
          <h1 className="text-xl font-semibold text-moonlight tracking-tight">فروشگاه جدید</h1>
          <p className="text-sm text-fog/60 mt-1">ثبت فروشگاه / تأمین‌کننده جدید</p>
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
                  <CardDescription>نام، آدرس و اطلاعات تماس</CardDescription>
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
                <FormInput control={form.control} name="workingHours" label="ساعات کاری" placeholder="مثال: ۸ صبح تا ۵ عصر" />
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
                  <MapPin className="size-4.5 text-electric-iris" />
                </div>
                <div>
                  <CardTitle>موقعیت جغرافیایی</CardTitle>
                  <CardDescription>استان و شهر</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormSearchSelect
                  control={form.control}
                  name="stateId"
                  label="استان"
                  placeholder="جستجوی استان..."
                  fetcher={async (search?: string) => {
                    const result = await getStates(
                      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                      { _id: 1, name: 1 }
                    );
                    if (!result.success || !result.body) return [];
                    return result.body.map((s: { _id?: string; name?: string }) => ({
                      _id: s._id || "",
                      name: s.name || "",
                    }));
                  }}
                />
                <FormSearchSelect
                  control={form.control}
                  name="cityId"
                  label="شهر"
                  placeholder="جستجوی شهر..."
                  fetcher={async (search?: string) => {
                    const result = await getCities(
                      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                      { _id: 1, name: 1 }
                    );
                    if (!result.success || !result.body) return [];
                    return result.body.map((c: { _id?: string; name?: string }) => ({
                      _id: c._id || "",
                      name: c.name || "",
                    }));
                  }}
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
                <div>
                  <CardTitle>مشخصات حقوقی</CardTitle>
                  <CardDescription>کد اقتصادی، شناسه ملی، شماره ثبت</CardDescription>
                </div>
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
              </div>
              <FormInput control={form.control} name="postalCode" label="کد پستی" />
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Banknote className="size-4.5 text-electric-iris" />
                </div>
                <div>
                  <CardTitle>اطلاعات بانکی</CardTitle>
                  <CardDescription>شماره کارت، شبا، نام صاحب حساب</CardDescription>
                </div>
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
                <div>
                  <CardTitle>تنظیمات دیگر</CardTitle>
                  <CardDescription>امتیاز، تحویل سریع، تعطیلات</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  control={form.control}
                  name="score"
                  label="امتیاز"
                  placeholder="۰"
                  type="number"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormCheckbox control={form.control} name="fastDelivery" label="تحویل سریع" />
                <FormCheckbox control={form.control} name="isAvailableInHolidays" label="فعال در تعطیلات" />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="gap-2 min-w-[160px]">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {submitting ? "در حال ثبت..." : "ایجاد فروشگاه"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>انصراف</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
