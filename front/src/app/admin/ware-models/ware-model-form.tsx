"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Cuboid } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/wareModel/add"
import { update } from "@/app/actions/wareModel/update"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { gets as getWareClasses } from "@/app/actions/wareClass/gets"
import { gets as getWareGroups } from "@/app/actions/wareGroup/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const wareModelSchema = z.object({
  name: z.string().min(1, "نام مدل کالا الزامی است"),
  enName: z.string().optional(),
  wareTypeId: z.string().min(1, "انتخاب نوع کالا الزامی است"),
  wareClassId: z.string().min(1, "انتخاب کلاس کالا الزامی است"),
  wareGroupId: z.string().min(1, "انتخاب گروه کالا الزامی است"),
})

type WareModelData = z.infer<typeof wareModelSchema>

interface WareModelFormProps {
  item?: {
    _id: string
    name?: string
    enName?: string
    wareType?: { _id: string; name?: string }
    wareClass?: { _id: string; name?: string }
    wareGroup?: { _id: string; name?: string }
  }
}

const wareTypeFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareTypes(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1 }
  )
  if (!result.success) return []
  return (result.body as { _id: string; name?: string }[]).map((s) => ({ _id: s._id, name: s.name || "" }))
}

const wareClassFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareClasses(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1 }
  )
  if (!result.success) return []
  return (result.body as { _id: string; name?: string }[]).map((s) => ({ _id: s._id, name: s.name || "" }))
}

const wareGroupFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareGroups(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1 }
  )
  if (!result.success) return []
  return (result.body as { _id: string; name?: string }[]).map((s) => ({ _id: s._id, name: s.name || "" }))
}

export function WareModelForm({ item }: WareModelFormProps) {
  const router = useRouter()
  const isEdit = Boolean(item)

  const form = useForm<WareModelData>({
    resolver: zodV4Resolver(wareModelSchema),
    defaultValues: {
      name: item?.name || "",
      enName: item?.enName || "",
      wareTypeId: item?.wareType?._id || "",
      wareClassId: item?.wareClass?._id || "",
      wareGroupId: item?.wareGroup?._id || "",
    },
  })

  const onSubmit = async (data: WareModelData) => {
    const activeRoleId = getActiveRoleIdFromStore()
    if (isEdit && item) {
      const result = await update(
        { activeRoleId, _id: item._id, name: data.name, enName: data.enName || undefined },
        { _id: 1, name: 1 }
      )
      if (result.success) {
        toast.success("مدل کالا با موفقیت به‌روزرسانی شد")
        router.push("/admin/ware-models")
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی مدل کالا")
      }
      return
    }

    const result = await add(
      {
        activeRoleId,
        name: data.name,
        enName: data.enName || undefined,
        wareTypeId: data.wareTypeId,
        wareClassId: data.wareClassId,
        wareGroupId: data.wareGroupId,
      },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("مدل کالا با موفقیت ایجاد شد")
      router.push("/admin/ware-models")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد مدل کالا")
    }
  }

  return (
    <EntityFormShell
      title={isEdit ? "ویرایش مدل کالا" : "افزودن مدل کالا"}
      helpTopicId="admin-ware-models"
      helpTooltip="راهنمای مدل کالا"
      description="مدل کالا، سطح چهارم سلسله‌مراتب دسته‌بندی است و به نوع، کلاس و گروه کالا متصل می‌شود."
      backHref="/admin/ware-models"
      backLabel="بازگشت به مدل‌های کالا"
      submitLabel={isEdit ? "ذخیره تغییرات" : "ثبت مدل کالا"}
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={Cuboid}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="اطلاعات اصلی"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <FormInput control={form.control} name="name" label="نام مدل کالا" placeholder="مثال: مقاومت ۱۰۰ اهم" required />
        <FormInput control={form.control} name="enName" label="نام لاتین" placeholder="مثال: 100 Ohm Resistor" />
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
        <FormSearchSelect
          control={form.control}
          name="wareClassId"
          label="کلاس کالا"
          placeholder="کلاس کالا را انتخاب کنید…"
          fetcher={wareClassFetcher}
          displayLabel={item?.wareClass?.name}
          required
          disabled={isEdit}
        />
        <FormSearchSelect
          control={form.control}
          name="wareGroupId"
          label="گروه کالا"
          placeholder="گروه کالا را انتخاب کنید…"
          fetcher={wareGroupFetcher}
          displayLabel={item?.wareGroup?.name}
          required
          disabled={isEdit}
        />
        {isEdit && (
          <p className="text-body-sm text-fog/60">
            نوع، کلاس و گروه کالا پس از ایجاد قابل تغییر نیستند.
          </p>
        )}
      </SectionCard>
    </EntityFormShell>
  )
}
