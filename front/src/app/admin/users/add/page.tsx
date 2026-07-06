"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodV4Resolver } from "@/lib/zod-v4-resolver";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/form/form-input";
import { FormSelect } from "@/components/form/form-select";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormCard } from "@/components/form/form-card";
import { PageHeader } from "@/components/ui/page-header";
import { Form } from "@/components/ui/form";
import { addUser } from "@/app/actions/user/addUser";
import Link from "next/link";

const userSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  email: z.string().email("ایمیل نامعتبر است"),
  mobile: z.string().min(10, "شماره موبایل نامعتبر است"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  gender: z.enum(["Male", "Female"]),
  position: z.string().optional(),
  is_verified: z.boolean(),
});

type UserData = z.input<typeof userSchema>;

export default function AddUserPage() {
  const router = useRouter();
  const form = useForm<UserData>({
    resolver: zodV4Resolver(userSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      mobile: "",
      password: "",
      gender: "Male",
      position: "",
      is_verified: false,
    },
  });

  const onSubmit = async (data: UserData) => {
    const result = await addUser(
      {
        activeRoleId: "",
        ...data,
        roles: [{ name: "Ordinary" }],
      },
      { _id: 1, first_name: 1, last_name: 1, email: 1 }
    );
    if (result.success) {
      toast.success("کاربر با موفقیت ایجاد شد");
      router.push("/admin/users");
      router.refresh();
    } else {
      toast.error(result.body?.message || "خطا در ایجاد کاربر");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="text-fog hover:text-moonlight transition-colors"
        >
          <ArrowRight className="size-5" />
        </Link>
        <PageHeader
          title="کاربر جدید"
          description="ایجاد کاربر جدید در سامانه"
          className="border-none mb-0 pb-0"
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormCard title="اطلاعات شخصی" description="مشخصات پایه کاربر را وارد کنید">
            <FormInput
              control={form.control}
              name="first_name"
              label="نام"
              placeholder="مثال: علی"
              required
            />
            <FormInput
              control={form.control}
              name="last_name"
              label="نام خانوادگی"
              placeholder="مثال: محمدی"
              required
            />
            <FormInput
              control={form.control}
              name="email"
              label="ایمیل"
              placeholder="example@email.com"
              type="email"
              required
            />
            <FormInput
              control={form.control}
              name="mobile"
              label="شماره موبایل"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              required
            />
            <FormInput
              control={form.control}
              name="password"
              label="رمز عبور"
              type="password"
              placeholder="حداقل ۶ کاراکتر"
              required
            />
            <FormSelect
              control={form.control}
              name="gender"
              label="جنسیت"
              options={[
                { value: "Male", label: "مرد" },
                { value: "Female", label: "زن" },
              ]}
            />
            <FormInput
              control={form.control}
              name="position"
              label="سمت"
              placeholder="مثال: مدیر مالی"
            />
            <FormCheckbox
              control={form.control}
              name="is_verified"
              label="تایید شده"
            />
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
              ایجاد کاربر
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
