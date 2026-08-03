"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { FolderTree } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/wareType/add"
import { update } from "@/app/actions/wareType/update"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const wareTypeSchema = z.object({
  name: z.string().min(1, "نام نوع کالا الزامی است"),
  enName: z.string().optional(),
})

type WareTypeData = z.infer<typeof wareTypeSchema>

interface WareTypeFormProps {
  item?: { _id: string; name?: string; enName?: string }
}

export function WareTypeForm({ item }: WareTypeFormProps) {
  const router = useRouter()
  const isEdit = Boolean(item)

  const form = useForm<WareTypeData>({
    resolver: zodV4Resolver(wareTypeSchema),
    defaultValues: {
      name: item?.name || "",
      enName: item?.enName || "",
    },
  })

  const onSubmit = async (data: WareTypeData) => {
    const activeRoleId = getActiveRoleIdFromStore()
    if (isEdit && item) {
      const result = await update(
        { activeRoleId, _id: item._id, name: data.name, enName: data.enName || undefined },
        { _id: 1, name: 1 }
      )
      if (result.success) {
        toast.success("نوع کالا با موفقیت به‌روزرسانی شد")
        router.push("/admin/ware-types")
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی نوع کالا")
      }
      return
    }

    const result = await add(
      { activeRoleId, name: data.name, enName: data.enName || undefined },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("نوع کالا با موفقیت ایجاد شد")
      router.push("/admin/ware-types")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد نوع کالا")
    }
  }

  return (
    <EntityFormShell
      title={isEdit ? "ویرایش نوع کالا" : "افزودن نوع کالا"}
      description="نام و نام لاتین نوع کالا را مشخص کنید؛ انواع کالا بالاترین سطح سلسله‌مراتب دسته‌بندی هستند."
      backHref="/admin/ware-types"
      backLabel="بازگشت به انواع کالا"
      submitLabel={isEdit ? "ذخیره تغییرات" : "ثبت نوع کالا"}
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={FolderTree}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="اطلاعات اصلی"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <FormInput
          control={form.control}
          name="name"
          label="نام نوع کالا"
          placeholder="مثال: الکترونیکی"
          required
        />
        <FormInput
          control={form.control}
          name="enName"
          label="نام لاتین"
          placeholder="مثال: Electronic"
        />
      </SectionCard>
    </EntityFormShell>
  )
}
