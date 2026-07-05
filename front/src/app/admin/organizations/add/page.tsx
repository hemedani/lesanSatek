"use client";
 
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormCard } from "@/components/form/form-card";
import { PageHeader } from "@/components/ui/page-header";
import { Form } from "@/components/ui/form";
import { add } from "@/app/actions/organization/add";
import Link from "next/link";

const orgSchema = z.object({
  name: z.string().min(1, "نام سازمان الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type OrgData = z.input<typeof orgSchema>;

export default function AddOrganizationPage() {
  const router = useRouter();
  const form = useForm<OrgData>({
    resolver: zodV4Resolver(orgSchema),
    defaultValues: {
      name: "",
      enName: "",
      description: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: OrgData) => {
    const result = await add(
      { activeRoleId: "", ...data, isActive: data.isActive },
      { _id: 1, name: 1 }
    );
    if (result.success) {
      toast.success("سازمان با موفقیت ایجاد شد");
      router.push("/admin/organizations");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در ایجاد سازمان");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/organizations"
          className="text-fog hover:text-moonlight transition-colors"
        >
          <ArrowRight className="size-5" />
        </Link>
        <PageHeader
          title="سازمان جدید"
          description="ایجاد سازمان جدید در سامانه"
          className="border-none mb-0 pb-0"
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormCard title="اطلاعات سازمان" description="مشخصات پایه سازمان را وارد کنید">
            <FormInput
              control={form.control}
              name="name"
              label="نام سازمان"
              placeholder="مثال: شرکت نمونه"
              required
            />
            <FormInput
              control={form.control}
              name="enName"
              label="نام انگلیسی"
              placeholder="Example: Sample Inc."
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              placeholder="توضیحات مختصری درباره سازمان..."
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
              ایجاد سازمان
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
