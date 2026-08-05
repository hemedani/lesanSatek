"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { Package } from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { add } from "@/app/actions/ware/add"
import { update } from "@/app/actions/ware/update"
import { updateRelations } from "@/app/actions/ware/updateRelations"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { gets as getWareClasses } from "@/app/actions/wareClass/gets"
import { gets as getWareGroups } from "@/app/actions/wareGroup/gets"
import { gets as getWareModels } from "@/app/actions/wareModel/gets"
import { gets as getManufacturers } from "@/app/actions/manufacturer/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const wareSchema = z.object({
  name: z.string().min(1, "نام کالا الزامی است"),
  enName: z.string().optional(),
  brand: z.string().optional(),
  price: z.string().optional(),
  orderedNumber: z.string().optional(),
  irc: z.string().optional(),
  umdns: z.string().optional(),
  gtin: z.string().optional(),
  wareTypeId: z.string().min(1, "انتخاب نوع کالا الزامی است"),
  wareClassId: z.string().min(1, "انتخاب کلاس کالا الزامی است"),
  wareGroupId: z.string().min(1, "انتخاب گروه کالا الزامی است"),
  wareModelId: z.string().min(1, "انتخاب مدل کالا الزامی است"),
  manufacturerId: z.string().optional(),
})

type WareData = z.infer<typeof wareSchema>

interface WareFormProps {
  item?: {
    _id: string
    name?: string
    enName?: string
    brand?: string
    price?: number
    orderedNumber?: number
    irc?: string
    umdns?: number
    gtin?: number
    wareType?: { _id: string; name?: string }
    wareClass?: { _id: string; name?: string }
    wareGroup?: { _id: string; name?: string }
    wareModel?: { _id: string; name?: string }
    manufacturer?: { _id: string; name?: string }
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

const wareModelFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWareModels(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1 }
  )
  if (!result.success) return []
  return (result.body as { _id: string; name?: string }[]).map((s) => ({ _id: s._id, name: s.name || "" }))
}

const manufacturerFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getManufacturers(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1 }
  )
  if (!result.success) return []
  return (result.body as { _id: string; name?: string }[]).map((s) => ({ _id: s._id, name: s.name || "" }))
}

export function WareForm({ item }: WareFormProps) {
  const router = useRouter()
  const isEdit = Boolean(item)

  const form = useForm<WareData>({
    resolver: zodV4Resolver(wareSchema),
    defaultValues: {
      name: item?.name || "",
      enName: item?.enName || "",
      brand: item?.brand || "",
      price: item?.price != null ? String(item.price) : "",
      orderedNumber: item?.orderedNumber != null ? String(item.orderedNumber) : "",
      irc: item?.irc || "",
      umdns: item?.umdns != null ? String(item.umdns) : "",
      gtin: item?.gtin != null ? String(item.gtin) : "",
      wareTypeId: item?.wareType?._id || "",
      wareClassId: item?.wareClass?._id || "",
      wareGroupId: item?.wareGroup?._id || "",
      wareModelId: item?.wareModel?._id || "",
      manufacturerId: item?.manufacturer?._id || "",
    },
  })

  const onSubmit = async (data: WareData) => {
    const activeRoleId = getActiveRoleIdFromStore()
    const payload = {
      name: data.name,
      enName: data.enName || undefined,
      brand: data.brand || undefined,
      price: Number(data.price) || 0,
      orderedNumber: Number(data.orderedNumber) || 0,
      irc: data.irc || undefined,
      umdns: data.umdns ? Number(data.umdns) : undefined,
      gtin: data.gtin ? Number(data.gtin) : undefined,
    }

    if (isEdit && item) {
      const updateResult = await update(
        { activeRoleId, _id: item._id, ...payload },
        { _id: 1, name: 1 }
      )
      if (!updateResult.success) {
        toast.error(updateResult.body?.message || "خطا در به‌روزرسانی کالا")
        return
      }
      const relationsResult = await updateRelations(
        {
          activeRoleId,
          _id: item._id,
          wareTypeId: data.wareTypeId,
          wareClassId: data.wareClassId,
          wareGroupId: data.wareGroupId,
          wareModelId: data.wareModelId,
          manufacturerId: data.manufacturerId || undefined,
        },
        { _id: 1, name: 1 }
      )
      if (relationsResult.success) {
        toast.success("کالا با موفقیت به‌روزرسانی شد")
        router.push(`/admin/wares/${item._id}`)
      } else {
        toast.error(relationsResult.body?.message || "خطا در به‌روزرسانی روابط کالا")
      }
      return
    }

    const result = await add(
      {
        activeRoleId,
        ...payload,
        wareTypeId: data.wareTypeId,
        wareClassId: data.wareClassId,
        wareGroupId: data.wareGroupId,
        wareModelId: data.wareModelId,
        manufacturerId: data.manufacturerId || undefined,
      },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("کالا با موفقیت ایجاد شد")
      router.push("/admin/wares")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد کالا")
    }
  }

  return (
    <EntityFormShell
      title={isEdit ? "ویرایش کالا" : "افزودن کالا"}
      description="کالا، گره پایانی سلسله‌مراتب دسته‌بندی است و به مدل کالا و تولیدکننده متصل می‌شود."
      backHref="/admin/wares"
      backLabel="بازگشت به کالاها"
      submitLabel={isEdit ? "ذخیره تغییرات" : "ثبت کالا"}
      relationsHref={isEdit && item ? `/admin/wares/${item._id}/relations` : undefined}
      helpTopicId="admin-ware-add"
      helpTooltip="راهنمای افزودن کالا"
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={Package}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="اطلاعات اصلی"
        description="فیلدهای ستاره‌دار الزامی هستند."
      >
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormInput control={form.control} name="name" label="نام کالا" placeholder="مثال: مقاومت الکترونیکی" required />
          <FormInput control={form.control} name="enName" label="نام لاتین" placeholder="مثال: Electronic Resistor" />
        </div>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormInput control={form.control} name="brand" label="برند" placeholder="مثال: یاماها" />
          <FormInput control={form.control} name="orderedNumber" label="شماره سفارش" placeholder="مثال: ۱۰۰" />
        </div>
        <FormInput control={form.control} name="price" label="قیمت (ریال)" placeholder="مثال: ۱۰۰۰۰۰" />
      </SectionCard>

      <SectionCard
        icon={Package}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="شناسه‌های ثبت"
        description="کدهای شناسایی کالا در سامانه‌های مرجع."
      >
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FormInput control={form.control} name="irc" label="کد IRC" placeholder="مثال: ۱۲۳۴۵۶" />
          <FormInput control={form.control} name="umdns" label="کد UMDNS" placeholder="مثال: ۹۹۹۹" />
        </div>
        <FormInput control={form.control} name="gtin" label="کد GTIN" placeholder="مثال: ۶۲۶۴۴۵۵۷۷۶۶۴۴" />
      </SectionCard>

      <SectionCard
        icon={Package}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="سلسله‌مراتب دسته‌بندی"
        description="انتخاب کنید کالا در کدام شاخه از سلسله‌مراتب قرار می‌گیرد."
      >
        <FormSearchSelect
          control={form.control}
          name="wareTypeId"
          label="نوع کالا"
          placeholder="نوع کالا را انتخاب کنید…"
          fetcher={wareTypeFetcher}
          required
        />
        <FormSearchSelect
          control={form.control}
          name="wareClassId"
          label="کلاس کالا"
          placeholder="کلاس کالا را انتخاب کنید…"
          fetcher={wareClassFetcher}
          required
        />
        <FormSearchSelect
          control={form.control}
          name="wareGroupId"
          label="گروه کالا"
          placeholder="گروه کالا را انتخاب کنید…"
          fetcher={wareGroupFetcher}
          required
        />
        <FormSearchSelect
          control={form.control}
          name="wareModelId"
          label="مدل کالا"
          placeholder="مدل کالا را انتخاب کنید…"
          fetcher={wareModelFetcher}
          required
        />
        <FormSearchSelect
          control={form.control}
          name="manufacturerId"
          label="تولیدکننده"
          placeholder="تولیدکننده را انتخاب کنید…"
          fetcher={manufacturerFetcher}
        />
      </SectionCard>
    </EntityFormShell>
  )
}
