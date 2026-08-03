"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Layers } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/wareClass/add"
import { update } from "@/app/actions/wareClass/update"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const wareClassSchema = z.object({
  name: z.string().min(1, "نام کلاس کالا الزامی است"),
  enName: z.string().optional(),
  wareTypeId: z.string().min(1, "انتخاب نوع کالا الزامی است"),
})

type WareClassData = z.infer<typeof wareClassSchema>

interface WareClassFormProps {
  item?: { _id: string; name?: string; enName?: string; wareType?: { _id: string; name?: string } }
}

const wareTypeFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareTypes(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1 }
  )
  if (!result.success) return []
  return (result.body as { _id: string; name?: string }[]).map((s) => ({ _id: s._id, name: s.name || "" }))
}

export function WareClassForm({ item }: WareClassFormProps) {
  const router = useRouter()
  const isEdit = Boolean(item)

  const form = useForm<WareClassData>({
    resolver: zodV4Resolver(wareClassSchema),
    defaultValues: {
      name: item?.name || "",
      enName: item?.enName || "",
      wareTypeId: item?.wareType?._id || "",
    },
  })

  const onSubmit = async (data: WareClassData) => {
    const activeRoleId = getActiveRoleIdFromStore()
    if (isEdit && item) {
      const result = await update(
        { activeRoleId, _id: item._id, name: data.name, enName: data.enName || undefined },
        { _id: 1, name: 1 }
      )
      if (result.success) {
        toast.success("کلاس کالا با موفقیت به‌روزرسانی شد")
        router.push("/admin/ware-classes")
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی کلاس کالا")
      }
      return
    }

    const result = await add(
      { activeRoleId, name: data.name, enName: data.enName || undefined, wareTypeId: data.wareTypeId },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("کلاس کالا با موفقیت ایجاد شد")
      router.push("/admin/ware-classes")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد کلاس کالا")
    }
  }

  return (
    <EntityFormShell
      title={isEdit ? "ویرایش کلاس کالا" : "افزودن کلاس کالا"}
      description="کلاس کالا، سطح دوم سلسله‌مراتب دسته‌بندی است و زیرمجموعه یک نوع کالا قرار می‌گیرد."
      backHref="/admin/ware-classes"
      backLabel="بازگشت به کلاس‌های کالا"
      submitLabel={isEdit ? "ذخیره تغییرات" : "ثبت کلاس کالا"}
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={Layers}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="اطلاعات اصلی"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <FormInput control={form.control} name="name" label="نام کلاس کالا" placeholder="مثال: قطعات الکترونیکی" required />
        <FormInput control={form.control} name="enName" label="نام لاتین" placeholder="مثال: Electronic Parts" />
        <FormSearchSelect
          control={form.control}
          name="wareTypeId"
          label="نوع کالا"
          placeholder="نوع کالا را انتخاب کنید…"
          fetcher={wareTypeFetcher}
          displayLabel={item?.wareType?.name}
          required
          disabled={isEdit}
        />
        {isEdit && (
          <p className="text-body-sm text-fog/60">
            نوع کالا پس از ایجاد قابل تغییر نیست.
          </p>
        )}
      </SectionCard>
    </EntityFormShell>
  )
}
