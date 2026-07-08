"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSelect } from "@/components/form/form-select";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormCard } from "@/components/form/form-card";
import { PageHeader } from "@/components/ui/page-header";
import { Form } from "@/components/ui/form";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { get } from "@/app/actions/unit/get";
import { update } from "@/app/actions/unit/update";
import { remove } from "@/app/actions/unit/remove";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

const unitSchema = z.object({
  name: z.string().min(1, "نام واحد الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  type: z.string().min(1, "نوع واحد الزامی است"),
  isActive: z.boolean(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  warehouseCapacity: z.number().optional(),
  hasColdStorage: z.boolean().optional(),
  fleetSize: z.number().optional(),
  serviceRadius: z.number().optional(),
});

type UnitData = z.input<typeof unitSchema>;

const unitTypeOptions = [
  { value: "General", label: "عمومی" },
  { value: "Warehouse", label: "انبار" },
  { value: "Logistics", label: "تدارکات" },
  { value: "Production", label: "تولید" },
  { value: "Administration", label: "اداری" },
  { value: "Expert", label: "کارشناسی" },
];

export default function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const form = useForm<UnitData>({
    resolver: zodV4Resolver(unitSchema),
    defaultValues: {
      name: "",
      enName: "",
      description: "",
      type: "",
      isActive: true,
      address: "",
      phone: "",
      email: "",
      warehouseCapacity: undefined,
      hasColdStorage: false,
      fleetSize: undefined,
      serviceRadius: undefined,
    },
  });

  useEffect(() => {
    const load = async () => {
      const result = await get(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        {
          _id: 1,
          name: 1,
          enName: 1,
          description: 1,
          type: 1,
          isActive: 1,
          address: 1,
          phone: 1,
          email: 1,
          warehouseCapacity: 1,
          hasColdStorage: 1,
          fleetSize: 1,
          serviceRadius: 1,
        }
      );
      if (result.success && result.body?.[0]) {
        const unit = result.body[0];
        form.reset({
          name: unit.name || "",
          enName: unit.enName || "",
          description: unit.description || "",
          type: unit.type || "",
          isActive: unit.isActive ?? true,
          address: unit.address || "",
          phone: unit.phone || "",
          email: unit.email || "",
          warehouseCapacity: unit.warehouseCapacity ?? undefined,
          hasColdStorage: unit.hasColdStorage ?? false,
          fleetSize: unit.fleetSize ?? undefined,
          serviceRadius: unit.serviceRadius ?? undefined,
        });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [form, id]);

  const onSubmit = async (data: UnitData) => {
    const result = await update(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: id,
        name: data.name,
        enName: data.enName || undefined,
        description: data.description || undefined,
        type: data.type as "General" | "Warehouse" | "Logistics" | "Production" | "Administration" | "Expert",
        isActive: data.isActive,
        address: data.address || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        warehouseCapacity: data.warehouseCapacity || undefined,
        hasColdStorage: data.hasColdStorage || undefined,
        fleetSize: data.fleetSize || undefined,
        serviceRadius: data.serviceRadius || undefined,
      },
      { _id: 1, name: 1 }
    );
    if (result.success) {
      toast.success("واحد با موفقیت به‌روزرسانی شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در به‌روزرسانی واحد");
    }
  };

  const handleDelete = async () => {
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: id });
    if (result.success) {
      toast.success("واحد با موفقیت حذف شد");
      router.push("/admin/units");
    } else {
      toast.error(result.body?.message || "خطا در حذف واحد");
    }
    setShowDelete(false);
  };

  if (loading) {
    return <LoadingSkeleton type="card" count={1} />;
  }

  if (notFound) {
    return (
      <div>
        <ErrorState
          title="واحد مورد نظر یافت نشد"
          message="واحدی با این شناسه در سامانه وجود ندارد."
        />
        <div className="flex justify-center mt-4">
          <Link href="/admin/units">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/units"
            className="text-fog hover:text-moonlight transition-colors"
          >
            <ArrowRight className="size-5" />
          </Link>
          <PageHeader
            title="ویرایش واحد"
            description="ویرایش اطلاعات واحد"
            className="border-none mb-0 pb-0"
          />
        </div>
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormCard title="اطلاعات واحد">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput
                control={form.control}
                name="name"
                label="نام واحد"
                required
              />
              <FormSelect
                control={form.control}
                name="type"
                label="نوع واحد"
                options={unitTypeOptions}
                required
              />
            </div>
            <FormInput
              control={form.control}
              name="enName"
              label="نام انگلیسی"
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              rows={3}
            />
            <FormCheckbox
              control={form.control}
              name="isActive"
              label="فعال"
            />
          </FormCard>

          <FormCard title="اطلاعات تماس">
            <FormInput
              control={form.control}
              name="address"
              label="آدرس"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput
                control={form.control}
                name="phone"
                label="تلفن"
              />
              <FormInput
                control={form.control}
                name="email"
                label="ایمیل"
              />
            </div>
          </FormCard>

          <FormCard title="ویژگی‌های انبار">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormInput
                control={form.control}
                name="warehouseCapacity"
                label="ظرفیت انبار (متر مربع)"
                type="number"
              />
              <FormInput
                control={form.control}
                name="fleetSize"
                label="تعداد ناوگان"
                type="number"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormCheckbox
                control={form.control}
                name="hasColdStorage"
                label="دارای سردخانه"
              />
              <FormInput
                control={form.control}
                name="serviceRadius"
                label="شعاع سرویس (کیلومتر)"
                type="number"
              />
            </div>
          </FormCard>

          <div className="flex items-center gap-2 justify-end">
            <Link href="/admin/units">
              <Button type="button" variant="ghost">
                انصراف
              </Button>
            </Link>
            <Button type="submit" disabled={form.formState.isSubmitting} className="gap-1.5">
              {form.formState.isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </Form>

      <div className="flex justify-center">
        <Link href={`/admin/units/${id}/relations`}>
          <Button type="button" variant="outline" className="gap-2">
            <Share2 className="size-4" />
            ویرایش روابط
          </Button>
        </Link>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف واحد"
        description="آیا از حذف این واحد اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </div>
  );
}
