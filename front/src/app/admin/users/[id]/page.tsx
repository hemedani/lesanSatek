"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, Trash2, Shield, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker";
import { FormSelect } from "@/components/form/form-select";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormCard } from "@/components/form/form-card";
import { PageHeader } from "@/components/ui/page-header";
import { Form } from "@/components/ui/form";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { getUser } from "@/app/actions/user/getUser";
import { updateUser } from "@/app/actions/user/updateUser";
import { removeUser } from "@/app/actions/user/removeUser";
import {
  FEATURES_OPTIONS,
} from "@/types/permissions";
import Link from "next/link";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";

const userSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  email: z.string().email("ایمیل نامعتبر است"),
  mobile: z.string().min(10, "شماره موبایل نامعتبر است"),
  gender: z.enum(["Male", "Female"]),
  isActive: z.boolean(),
  is_verified: z.boolean(),
  position: z.string().optional(),
  birth_date: z.string().optional(),
});

type UserData = z.infer<typeof userSchema>;

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const { id } = use(params);
  const [features, setFeatures] = useState<string[]>([]);
  const form = useForm<UserData>({
    resolver: zodV4Resolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      mobile: "",
      gender: "Male",
      isActive: true,
      is_verified: false,
      position: "",
      birth_date: "",
    },
  });

  useEffect(() => {
    const load = async () => {
      const result = await getUser(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        {
          _id: 1,
          first_name: 1,
          last_name: 1,
          email: 1,
          mobile: 1,
          gender: 1,
          isActive: 1,
          is_verified: 1,
          position: 1,
          birth_date: 1,
          roles: 1,
          features: 1,
          organizations: { _id: 1, name: 1 },
        }
      );
      if (result.success && result.body) {
        const user = result.body;
        form.reset({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          mobile: user.mobile || "",
          gender: user.gender || "Male",
          isActive: user.isActive ?? true,
          is_verified: user.is_verified ?? false,
          position: user.position || "",
          birth_date: user.birth_date || "",
        });
        setFeatures(user.features?.map((f: { feature: string }) => f.feature) || []);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [form]);

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const onSubmit = async (data: UserData) => {
    const result = await updateUser(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: id,
        ...data,
        features: features.map((f) => ({ feature: f as "canRegisterPurchaseRequest" })),
      },
      { _id: 1, first_name: 1 }
    );
    if (result.success) {
      toast.success("کاربر با موفقیت به‌روزرسانی شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در به‌روزرسانی کاربر");
    }
  };

  const handleDelete = async () => {
    const result = await removeUser({ activeRoleId: getActiveRoleIdFromStore(), _id: id });
    if (result.success) {
      toast.success("کاربر با موفقیت حذف شد");
      router.push("/admin/users");
    } else {
      toast.error(result.body?.message || "خطا در حذف کاربر");
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
          title="کاربر مورد نظر یافت نشد"
          message="کاربری با این شناسه در سامانه وجود ندارد."
        />
        <div className="flex justify-center mt-4">
          <Link href="/admin/users">
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
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="text-fog hover:text-moonlight transition-colors"
          >
            <ArrowRight className="size-5" />
          </Link>
          <PageHeader
            title="ویرایش کاربر"
            description="ویرایش اطلاعات و دسترسی‌های کاربر"
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
          <FormCard title="اطلاعات شخصی">
            <FormInput
              control={form.control}
              name="first_name"
              label="نام"
              required
            />
            <FormInput
              control={form.control}
              name="last_name"
              label="نام خانوادگی"
              required
            />
            <FormInput
              control={form.control}
              name="email"
              label="ایمیل"
              type="email"
              required
            />
            <FormInput
              control={form.control}
              name="mobile"
              label="شماره موبایل"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormSelect
                control={form.control}
                name="gender"
                label="جنسیت"
                options={[
                  { value: "Male", label: "مرد" },
                  { value: "Female", label: "زن" },
                ]}
              />
              <FormJalaliDatePicker
                control={form.control}
                name="birth_date"
                label="تاریخ تولد"
              />
            </div>
            <FormInput
              control={form.control}
              name="position"
              label="سمت"
              placeholder="مثال: مدیر مالی"
            />
            <FormCheckbox
              control={form.control}
              name="isActive"
              label="فعال"
            />
            <FormCheckbox
              control={form.control}
              name="is_verified"
              label="تایید شده"
            />
          </FormCard>

          <FormCard title="نقش‌ها" description="مدیریت نقش‌های دسترسی کاربر از طریق صفحه اختصاصی">
            <div className="flex justify-center py-4">
              <Link href={`/admin/users/${id}/roles`}>
                <Button type="button" variant="outline" className="gap-2">
                  <Shield className="size-4" />
                  مدیریت نقش‌ها
                </Button>
              </Link>
            </div>
          </FormCard>

          <FormCard title="دسترسی‌ها" description="دسترسی‌های ویژه کاربر">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEATURES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleFeature(opt.value)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border ${
                    features.includes(opt.value)
                      ? "bg-electric-iris/10 border-electric-iris/25 text-frost-link"
                      : "bg-white/[0.02] border-steel-border/20 text-fog/70 hover:text-moonlight hover:border-steel-border/40"
                  }`}
                >
                  <div className={`size-4 rounded flex items-center justify-center transition-colors ${
                    features.includes(opt.value)
                      ? "bg-electric-iris text-white"
                      : "bg-white/[0.05] border border-steel-border/30"
                  }`}>
                    {features.includes(opt.value) && <Check className="size-3" />}
                  </div>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </FormCard>

          <div className="flex items-center gap-2 justify-end">
            <Link href="/admin/users">
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
        <Link href={`/admin/users/${id}/relations`}>
          <Button type="button" variant="outline" className="gap-2">
            <Share2 className="size-4" />
            ویرایش روابط
          </Button>
        </Link>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف کاربر"
        description="آیا از حذف این کاربر اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </div>
  );
}
