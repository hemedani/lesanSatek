"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormCard } from "@/components/form/form-card";
import { PageHeader } from "@/components/ui/page-header";
import { Form } from "@/components/ui/form";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { get as getOrg } from "@/app/actions/organization/get";
import { update } from "@/app/actions/organization/update";
import { remove } from "@/app/actions/organization/remove";
import Link from "next/link";

const orgSchema = z.object({
  name: z.string().min(1, "نام سازمان الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type OrgData = z.input<typeof orgSchema>;

export default function EditOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const form = useForm<OrgData>({
    resolver: zodV4Resolver(orgSchema),
    defaultValues: {
      name: "",
      enName: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    const load = async () => {
      const { id } = await params;
      const result = await getOrg(
        { activeRoleId: "", _id: id },
        { _id: 1, name: 1, enName: 1, description: 1, isActive: 1 }
      );
      if (result.success && result.body?.[0]) {
        const org = result.body[0];
        form.reset({
          name: org.name || "",
          enName: org.enName || "",
          description: org.description || "",
          isActive: org.isActive ?? true,
        });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [params, form]);

  const onSubmit = async (data: OrgData) => {
    const { id } = await params;
    const result = await update(
      { activeRoleId: "", _id: id, ...data },
      { _id: 1, name: 1 }
    );
    if (result.success) {
      toast.success("سازمان با موفقیت به‌روزرسانی شد");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در به‌روزرسانی سازمان");
    }
  };

  const handleDelete = async () => {
    const { id } = await params;
    const result = await remove({ activeRoleId: "", _id: id });
    if (result.success) {
      toast.success("سازمان با موفقیت حذف شد");
      router.push("/admin/organizations");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در حذف سازمان");
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
          title="سازمان مورد نظر یافت نشد"
          message="سازمانی با این شناسه در سامانه وجود ندارد."
        />
        <div className="flex justify-center mt-4">
          <Link href="/admin/organizations">
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
            href="/admin/organizations"
            className="text-fog hover:text-moonlight transition-colors"
          >
            <ArrowRight className="size-5" />
          </Link>
          <PageHeader
            title="ویرایش سازمان"
            description="ویرایش اطلاعات سازمان"
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
          <FormCard title="اطلاعات سازمان">
            <FormInput
              control={form.control}
              name="name"
              label="نام سازمان"
              required
            />
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

          <div className="flex items-center gap-2 justify-end">
            <Link href="/admin/organizations">
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

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف سازمان"
        description="آیا از حذف این سازمان اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </div>
  );
}
