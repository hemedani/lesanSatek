"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/form/form-input";
import { FormTextarea } from "@/components/form/form-textarea";
import { FormSelect } from "@/components/form/form-select";
import { FormCard } from "@/components/form/form-card";
import { getActiveRoleIdFromStore } from "@/lib/client-active-role";
import { add } from "@/app/actions/budgetLine/add";

const schema = z.object({
  code: z.string().min(1, "کد ردیف بودجه الزامی است"),
  title: z.string().min(1, "عنوان ردیف بودجه الزامی است"),
  description: z.string().optional(),
  totalAllocated: z.string().optional(),
  fiscalYearId: z.string().min(1, "انتخاب سال مالی الزامی است"),
});

type FormData = z.input<typeof schema>;

interface FiscalYearOption {
  _id: string;
  name?: string;
}

export function NewBudgetLineForm({
  organizationId,
  fiscalYears,
}: {
  organizationId: string;
  fiscalYears: FiscalYearOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodV4Resolver(schema),
    defaultValues: {
      code: "",
      title: "",
      description: "",
      totalAllocated: "",
      fiscalYearId: "",
    },
  });

  const fyOptions = fiscalYears.map((fy) => ({
    value: fy._id,
    label: fy.name || "—",
  }));

  const handleSave = async (values: FormData) => {
    setSaving(true);
    try {
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          code: values.code,
          title: values.title,
          description: values.description || undefined,
          totalAllocated: values.totalAllocated ? Number(values.totalAllocated) : undefined,
          fiscalYearId: values.fiscalYearId,
          organizationId,
        },
        { _id: 1, code: 1, title: 1 },
      );
      if (result.success && result.body?._id) {
        toast.success("ردیف بودجه با موفقیت ایجاد شد.");
        router.push(`/unit-head/finance/budget-lines/${result.body._id}`);
      } else {
        toast.error(result.body?.message || "خطا در ایجاد ردیف بودجه");
      }
    } catch {
      toast.error("خطا در ایجاد ردیف بودجه");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
        <FormCard title="مشخصات ردیف بودجه" description="اطلاعات پایه ردیف بودجه را وارد کنید.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput control={form.control} name="code" label="کد ردیف" placeholder="مثال: 01-001" required />
            <FormInput control={form.control} name="title" label="عنوان" placeholder="مثال: بودجه جاری سال ۱۴۰۵" required />
          </div>
          <FormTextarea control={form.control} name="description" label="توضیحات" placeholder="توضیحات اختیاری" />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput control={form.control} name="totalAllocated" label="مبلغ تخصیص" type="number" placeholder="مبلغ به ریال" />
            <FormSelect
              control={form.control}
              name="fiscalYearId"
              label="سال مالی"
              placeholder="انتخاب سال مالی..."
              options={fyOptions}
              required
            />
          </div>
        </FormCard>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            انصراف
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {saving ? "در حال ذخیره..." : "ایجاد ردیف"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
