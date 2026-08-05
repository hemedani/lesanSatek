"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Building2 } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/manufacturer/add"
import { update } from "@/app/actions/manufacturer/update"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const manufacturerSchema = z.object({
  name: z.string().min(1, "نام تولیدکننده الزامی است"),
  enName: z.string().optional(),
  country: z.string().optional(),
})

type ManufacturerData = z.infer<typeof manufacturerSchema>

interface ManufacturerFormProps {
  item?: { _id: string; name?: string; enName?: string; country?: string }
}

export function ManufacturerForm({ item }: ManufacturerFormProps) {
  const router = useRouter()
  const isEdit = Boolean(item)

  const form = useForm<ManufacturerData>({
    resolver: zodV4Resolver(manufacturerSchema),
    defaultValues: {
      name: item?.name || "",
      enName: item?.enName || "",
      country: item?.country || "",
    },
  })

  const onSubmit = async (data: ManufacturerData) => {
    const activeRoleId = getActiveRoleIdFromStore()
    if (isEdit && item) {
      const result = await update(
        { activeRoleId, _id: item._id, name: data.name, enName: data.enName || undefined, country: data.country || undefined },
        { _id: 1, name: 1 }
      )
      if (result.success) {
        toast.success("تولیدکننده با موفقیت به‌روزرسانی شد")
        router.push("/admin/manufacturers")
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی تولیدکننده")
      }
      return
    }

    const result = await add(
      { activeRoleId, name: data.name, enName: data.enName || undefined, country: data.country || undefined },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("تولیدکننده با موفقیت ایجاد شد")
      router.push("/admin/manufacturers")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد تولیدکننده")
    }
  }

  return (
    <EntityFormShell
      title={isEdit ? "ویرایش تولیدکننده" : "افزودن تولیدکننده"}
      helpTopicId="admin-manufacturers"
      helpTooltip="راهنمای تولیدکننده"
      description="مشخصات تولیدکننده کالا را وارد کنید؛ تولیدکننده به مدل‌های کالا متصل می‌شود."
      backHref="/admin/manufacturers"
      backLabel="بازگشت به تولیدکنندگان"
      submitLabel={isEdit ? "ذخیره تغییرات" : "ثبت تولیدکننده"}
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={Building2}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="اطلاعات اصلی"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <FormInput control={form.control} name="name" label="نام تولیدکننده" placeholder="مثال: سامسونگ" required />
        <FormInput control={form.control} name="enName" label="نام لاتین" placeholder="مثال: Samsung" />
        <FormInput control={form.control} name="country" label="کشور" placeholder="مثال: کره جنوبی" />
      </SectionCard>
    </EntityFormShell>
  )
}
