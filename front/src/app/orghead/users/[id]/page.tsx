"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/form/form-input"
import { FormSelect } from "@/components/form/form-select"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormCard } from "@/components/form/form-card"
import { Form } from "@/components/ui/form"
import { PageHeader } from "@/components/ui/page-header"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ErrorState } from "@/components/ui/error-state"
import { getUser } from "@/app/actions/user/getUser"
import { updateUser } from "@/app/actions/user/updateUser"
import { removeUser } from "@/app/actions/user/removeUser"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import Link from "next/link"

const userSchema = z.object({
  first_name: z.string().min(1, "نام الزامی است"),
  last_name: z.string().min(1, "نام خانوادگی الزامی است"),
  email: z.string().email("ایمیل نامعتبر است"),
  mobile: z.string().min(10, "شماره موبایل نامعتبر است"),
  gender: z.enum(["Male", "Female"]),
  isActive: z.boolean(),
  is_verified: z.boolean(),
  position: z.string().optional(),
})

type UserData = z.infer<typeof userSchema>

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const { id } = use(params)

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
    },
  })

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
        },
      )
      if (result.success && result.body) {
        const user = result.body
        form.reset({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          mobile: user.mobile || "",
          gender: user.gender || "Male",
          isActive: user.isActive ?? true,
          is_verified: user.is_verified ?? false,
          position: user.position || "",
        })
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
  }, [form, id])

  const onSubmit = async (data: UserData) => {
    const result = await updateUser(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: id,
        ...data,
      },
      { _id: 1, first_name: 1 },
    )
    if (result.success) {
      toast.success("کاربر با موفقیت به‌روزرسانی شد")
      router.refresh()
    } else {
      toast.error(result.body?.message || "خطا در به‌روزرسانی کاربر")
    }
  }

  const handleDelete = async () => {
    const result = await removeUser({ activeRoleId: getActiveRoleIdFromStore(), _id: id })
    if (result.success) {
      toast.success("کاربر با موفقیت حذف شد")
      router.push("/orghead/users")
    } else {
      toast.error(result.body?.message || "خطا در حذف کاربر")
    }
    setShowDelete(false)
  }

  if (loading) return <LoadingSkeleton type="card" count={1} />

  if (notFound) {
    return (
      <div>
        <ErrorState title="کاربر مورد نظر یافت نشد" message="کاربری با این شناسه در سامانه وجود ندارد." />
        <div className="flex justify-center mt-4">
          <Link href="/orghead/users">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/orghead/users" className="text-fog hover:text-moonlight transition-colors">
            <ArrowRight className="size-5" />
          </Link>
          <PageHeader title="ویرایش کاربر" description="ویرایش اطلاعات کاربر" className="border-none mb-0 pb-0" />
        </div>
        <Button variant="ghost" size="sm" className="text-destructive gap-1.5" onClick={() => setShowDelete(true)}>
          <Trash2 className="size-4" />
          حذف
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormCard title="اطلاعات شخصی">
            <FormInput control={form.control} name="first_name" label="نام" required />
            <FormInput control={form.control} name="last_name" label="نام خانوادگی" required />
            <FormInput control={form.control} name="email" label="ایمیل" type="email" required />
            <FormInput control={form.control} name="mobile" label="شماره موبایل" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormSelect control={form.control} name="gender" label="جنسیت" options={[{ value: "Male", label: "مرد" }, { value: "Female", label: "زن" }]} />
              <FormInput control={form.control} name="position" label="سمت" placeholder="مثال: مدیر مالی" />
            </div>
            <FormCheckbox control={form.control} name="isActive" label="فعال" />
            <FormCheckbox control={form.control} name="is_verified" label="تایید شده" />
          </FormCard>

          <div className="flex items-center gap-2 justify-end">
            <Link href="/orghead/users">
              <Button type="button" variant="ghost">انصراف</Button>
            </Link>
            <Button type="submit" disabled={form.formState.isSubmitting} className="gap-1.5">
              {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
              ذخیره تغییرات
            </Button>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف کاربر"
        description="آیا از حذف این کاربر اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </div>
  )
}
