"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Grid3X3 } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { FormSearchMultiSelect } from "@/components/form/form-search-multi-select"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/wareGroup/add"
import { update } from "@/app/actions/wareGroup/update"
import { updateRelations } from "@/app/actions/wareGroup/updateRelations"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { gets as getWareClasses } from "@/app/actions/wareClass/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const wareGroupSchema = z.object({
  name: z.string().min(1, "نام گروه کالا الزامی است"),
  enName: z.string().optional(),
  wareTypeId: z.string().min(1, "انتخاب نوع کالا الزامی است"),
  wareClassIds: z.array(z.string()).optional(),
})

type WareGroupData = z.infer<typeof wareGroupSchema>

interface WareGroupFormProps {
  item?: {
    _id: string
    name?: string
    enName?: string
    wareType?: { _id: string; name?: string }
    wareClasses?: { _id: string; name?: string }[]
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

export function WareGroupForm({ item }: WareGroupFormProps) {
  const router = useRouter()
  const isEdit = Boolean(item)
  const [nameMap, setNameMap] = useState<Record<string, string>>(
    Object.fromEntries((item?.wareClasses || []).map((c) => [c._id, c.name || ""]))
  )

  const form = useForm<WareGroupData>({
    resolver: zodV4Resolver(wareGroupSchema),
    defaultValues: {
      name: item?.name || "",
      enName: item?.enName || "",
      wareTypeId: item?.wareType?._id || "",
      wareClassIds: (item?.wareClasses || []).map((c) => c._id),
    },
  })

  const wareClassFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
    const wareTypeId = form.getValues("wareTypeId")
    const result = await getWareClasses(
      {
        activeRoleId: getActiveRoleIdFromStore(),
        page: 1,
        limit: 100,
        search: q,
        ...(wareTypeId ? { wareTypeId } : {}),
      },
      { _id: 1, name: 1 }
    )
    if (!result.success) return []
    return (result.body as { _id: string; name?: string }[]).map((c) => ({ _id: c._id, name: c.name || "" }))
  }

  const onSubmit = async (data: WareGroupData) => {
    const activeRoleId = getActiveRoleIdFromStore()
    const payload = {
      name: data.name,
      enName: data.enName || undefined,
      wareTypeId: data.wareTypeId,
      wareClassIds: data.wareClassIds || [],
    }

    if (isEdit && item) {
      const updateResult = await update(
        { activeRoleId, _id: item._id, name: data.name, enName: data.enName || undefined },
        { _id: 1, name: 1 }
      )
      if (!updateResult.success) {
        toast.error(updateResult.body?.message || "خطا در به‌روزرسانی گروه کالا")
        return
      }
      const relationsResult = await updateRelations(
        { activeRoleId, _id: item._id, wareTypeId: payload.wareTypeId, wareClassIds: payload.wareClassIds },
        { _id: 1, name: 1 }
      )
      if (relationsResult.success) {
        toast.success("گروه کالا با موفقیت به‌روزرسانی شد")
        router.push("/admin/ware-groups")
      } else {
        toast.error(relationsResult.body?.message || "خطا در به‌روزرسانی روابط گروه کالا")
      }
      return
    }

    const result = await add(
      { activeRoleId, name: payload.name, enName: payload.enName, wareTypeId: payload.wareTypeId, wareClassIds: payload.wareClassIds },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("گروه کالا با موفقیت ایجاد شد")
      router.push("/admin/ware-groups")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد گروه کالا")
    }
  }

  return (
    <EntityFormShell
      title={isEdit ? "ویرایش گروه کالا" : "افزودن گروه کالا"}
      description="گروه کالا، سطح سوم سلسله‌مراتب دسته‌بندی است و زیرمجموعه یک نوع کالا قرار می‌گیرد."
      backHref="/admin/ware-groups"
      backLabel="بازگشت به گروه‌های کالا"
      submitLabel={isEdit ? "ذخیره تغییرات" : "ثبت گروه کالا"}
      relationsHref={isEdit && item ? `/admin/ware-groups/${item._id}/relations` : undefined}
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={Grid3X3}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="اطلاعات اصلی"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <FormInput control={form.control} name="name" label="نام گروه کالا" placeholder="مثال: مقاومت‌های الکترونیکی" required />
        <FormInput control={form.control} name="enName" label="نام لاتین" placeholder="مثال: Electronic Resistors" />
        <FormSearchSelect
          control={form.control}
          name="wareTypeId"
          label="نوع کالا"
          placeholder="نوع کالا را انتخاب کنید…"
          fetcher={wareTypeFetcher}
          required
          onValueChange={() => {
            form.setValue("wareClassIds", [], { shouldDirty: true })
            setNameMap({})
          }}
        />
        <FormSearchMultiSelect
          control={form.control}
          name="wareClassIds"
          label="رده‌های کالا"
          placeholder="رده‌های کالا را انتخاب کنید…"
          fetcher={wareClassFetcher}
          nameMap={nameMap}
          onSelectData={(option) => setNameMap((prev) => ({ ...prev, [option._id]: option.name }))}
        />
      </SectionCard>
    </EntityFormShell>
  )
}
