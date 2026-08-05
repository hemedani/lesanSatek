"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import {
  Store,
  MapPin,
  BadgeInfo,
  Banknote,
  Shield,
  Boxes,
} from "lucide-react"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormSelect } from "@/components/form/form-select"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { FormSearchMultiSelect } from "@/components/form/form-search-multi-select"
import { SectionCard } from "@/components/form/section-card"
import { EntityFormShell } from "@/components/admin/entity-form-shell"
import { LocationPicker } from "@/components/ui/location-picker"
import type { GeoPoint } from "@/components/ui/location-picker"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { add } from "@/app/actions/store/add"
import { update } from "@/app/actions/store/update"
import { updateRelations } from "@/app/actions/store/updateRelations"
import { gets as getStates } from "@/app/actions/state/gets"
import { gets as getCities } from "@/app/actions/city/gets"
import { gets as getWareTypes } from "@/app/actions/wareType/gets"
import { getUsers } from "@/app/actions/user/getUsers"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import { useAuthStore } from "@/stores/authStore"

const storeSchema = z.object({
  name: z.string().min(1, "نام فروشگاه الزامی است"),
  ceoname: z.string().optional(),
  address: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  workingHours: z.string().optional(),
  economicCode: z.string().optional(),
  postalCode: z.string().optional(),
  nationalId: z.string().optional(),
  registerNumber: z.string().optional(),
  certificateNumber: z.string().optional(),
  legalPerson: z.string().optional(),
  bankCardNumber: z.string().optional(),
  shebaNumber: z.string().optional(),
  nameOfAccountHolder: z.string().optional(),
  bankName: z.string().optional(),
  fastDelivery: z.boolean().default(false),
  isAvailableInHolidays: z.boolean().default(false),
  score: z.string().default("0"),
  status: z.string().min(1, "وضعیت الزامی است"),
  storeHeadId: z.string().optional(),
  cityId: z.string().optional(),
  stateId: z.string().optional(),
  wareTypeIds: z.array(z.string()).optional(),
})

type StoreData = z.infer<typeof storeSchema>

interface StoreFormProps {
  item?: {
    _id: string
    name?: string
    ceoname?: string
    address?: string
    contact?: string
    email?: string
    workingHours?: string
    economicCode?: string
    postalCode?: string
    nationalId?: string
    registerNumber?: string
    certificateNumber?: string
    legalPerson?: string
    bankCardNumber?: string
    shebaNumber?: string
    nameOfAccountHolder?: string
    bankName?: string
    fastDelivery?: boolean
    isAvailableInHolidays?: boolean
    score?: number
    status?: string
    geoLocation?: GeoPoint
    storeHead?: { _id: string; first_name?: string; last_name?: string }
    city?: { _id: string; name?: string }
    state?: { _id: string; name?: string }
    wareTypes?: { _id: string; name?: string }[]
  }
}

const statusOptions = [
  { value: "Active", label: "فعال" },
  { value: "Inactive", label: "غیرفعال" },
  { value: "Suspended", label: "تعلیق شده" },
  { value: "Blacklisted", label: "مسدود" },
]

const statesFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getStates(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q || undefined },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((s) => ({ _id: s._id, name: s.name || "" }))
}

const citiesFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getCities(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q || undefined },
    { _id: 1, name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id: string; name?: string }[]).map((c) => ({ _id: c._id, name: c.name || "" }))
}

const usersFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getUsers(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: q || undefined },
    { _id: 1, first_name: 1, last_name: 1 }
  )
  if (!result.success || !result.body) return []
  return (result.body as { _id?: string; first_name?: string; last_name?: string }[]).map((u) => ({
    _id: u._id || "",
    name: [u.first_name, u.last_name].filter(Boolean).join(" ") || "—",
  }))
}

export function StoreForm({ item }: StoreFormProps) {
  const router = useRouter()
  const isEdit = Boolean(item)
  const [geoLocation, setGeoLocation] = useState<GeoPoint>(item?.geoLocation || null)
  const [nameMap, setNameMap] = useState<Record<string, string>>(
    Object.fromEntries((item?.wareTypes || []).map((w) => [w._id, w.name || ""]))
  )

  const { user } = useAuthStore()
  const activeRole = user?.roles?.find((r) => r.roleId === getActiveRoleIdFromStore())
  const isStoreHead = activeRole?.name === "StoreHead"
  const denied = isEdit && isStoreHead && item ? activeRole?.scopeId !== item._id : false

  const form = useForm<StoreData>({
    resolver: zodV4Resolver(storeSchema),
    defaultValues: {
      name: item?.name || "",
      ceoname: item?.ceoname || "",
      address: item?.address || "",
      contact: item?.contact || "",
      email: item?.email || "",
      workingHours: item?.workingHours || "",
      economicCode: item?.economicCode || "",
      postalCode: item?.postalCode || "",
      nationalId: item?.nationalId || "",
      registerNumber: item?.registerNumber || "",
      certificateNumber: item?.certificateNumber || "",
      legalPerson: item?.legalPerson || "",
      bankCardNumber: item?.bankCardNumber || "",
      shebaNumber: item?.shebaNumber || "",
      nameOfAccountHolder: item?.nameOfAccountHolder || "",
      bankName: item?.bankName || "",
      fastDelivery: item?.fastDelivery ?? false,
      isAvailableInHolidays: item?.isAvailableInHolidays ?? false,
      score: String(item?.score ?? 0),
      status: item?.status || "Active",
      storeHeadId: item?.storeHead?._id || "",
      cityId: item?.city?._id || "",
      stateId: item?.state?._id || "",
      wareTypeIds: (item?.wareTypes || []).map((w) => w._id),
    },
  })

  if (denied) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="دسترسی محدود"
          message="شما فقط می‌توانید فروشگاه خود را ویرایش کنید."
        />
        <div className="flex justify-center mt-4">
          <Link href="/admin/stores">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست فروشگاه‌ها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const wareTypesFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
    const result = await getWareTypes(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q || undefined },
      { _id: 1, name: 1 }
    )
    if (!result.success || !result.body) return []
    return (result.body as { _id: string; name?: string }[]).map((t) => ({ _id: t._id, name: t.name || "" }))
  }

  const onSubmit = async (data: StoreData) => {
    const activeRoleId = getActiveRoleIdFromStore()
    const pureFields = {
      name: data.name,
      ceoname: data.ceoname || undefined,
      address: data.address || undefined,
      contact: data.contact || undefined,
      email: data.email || undefined,
      workingHours: data.workingHours || undefined,
      economicCode: data.economicCode || undefined,
      postalCode: data.postalCode || undefined,
      nationalId: data.nationalId || undefined,
      registerNumber: data.registerNumber || undefined,
      certificateNumber: data.certificateNumber || undefined,
      legalPerson: data.legalPerson || undefined,
      bankCardNumber: data.bankCardNumber || undefined,
      shebaNumber: data.shebaNumber || undefined,
      nameOfAccountHolder: data.nameOfAccountHolder || undefined,
      bankName: data.bankName || undefined,
      fastDelivery: data.fastDelivery,
      isAvailableInHolidays: data.isAvailableInHolidays,
      score: Number(data.score) || 0,
      status: data.status,
    }

    if (isEdit && item) {
      const updateResult = await update(
        {
          activeRoleId,
          _id: item._id,
          ...pureFields,
          ...(geoLocation ? { geoLocation } : {}),
        },
        { _id: 1, name: 1 }
      )
      if (!updateResult.success) {
        toast.error(updateResult.body?.message || "خطا در به‌روزرسانی فروشگاه")
        return
      }
      const relationsResult = await updateRelations(
        {
          activeRoleId,
          _id: item._id,
          ...(data.storeHeadId ? { storeHeadId: data.storeHeadId } : {}),
          ...(data.cityId ? { cityId: data.cityId } : {}),
          ...(data.stateId ? { stateId: data.stateId } : {}),
          ...(data.wareTypeIds && data.wareTypeIds.length ? { wareTypeIds: data.wareTypeIds } : {}),
        },
        { _id: 1, name: 1 }
      )
      if (relationsResult.success) {
        toast.success("فروشگاه با موفقیت به‌روزرسانی شد")
        router.push("/admin/stores")
      } else {
        toast.error(relationsResult.body?.message || "خطا در به‌روزرسانی روابط فروشگاه")
      }
      return
    }

    const result = await add(
      {
        activeRoleId,
        ...pureFields,
        totalSoldAmount: 0,
        totalSoldNum: 0,
        ...(data.storeHeadId ? { storeHeadId: data.storeHeadId } : {}),
        ...(data.cityId ? { cityId: data.cityId } : {}),
        ...(data.stateId ? { stateId: data.stateId } : {}),
        ...(data.wareTypeIds && data.wareTypeIds.length ? { wareTypeIds: data.wareTypeIds } : {}),
        ...(geoLocation ? { geoLocation } : {}),
      },
      { _id: 1, name: 1 }
    )
    if (result.success) {
      toast.success("فروشگاه با موفقیت ایجاد شد")
      router.push("/admin/stores")
    } else {
      toast.error(result.body?.message || "خطا در ایجاد فروشگاه")
    }
  }

  return (
    <EntityFormShell
      title={isEdit ? "ویرایش فروشگاه" : "افزودن فروشگاه"}
      description="فروشگاه محل نگهداری و تأمین کالا است و به یک مسئول، استان و شهر مرتبط می‌شود."
      backHref="/admin/stores"
      backLabel="بازگشت به فروشگاه‌ها"
      submitLabel={isEdit ? "ذخیره تغییرات" : "ثبت فروشگاه"}
      relationsHref={isEdit && item ? `/admin/stores/${item._id}/relations` : undefined}
      helpTopicId="admin-stores"
      helpTooltip="راهنمای فروشگاه"
      form={form}
      onSubmit={onSubmit}
    >
      <SectionCard
        icon={Store}
        iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
        title="اطلاعات فروشگاه"
        description="نام، آدرس و اطلاعات تماس"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput control={form.control} name="name" label="نام فروشگاه" placeholder="مثال: انبار مرکزی" required />
          <FormInput control={form.control} name="ceoname" label="نام مدیر" placeholder="نام مدیر فروشگاه" />
        </div>
        <FormTextarea control={form.control} name="address" label="آدرس" placeholder="آدرس کامل فروشگاه" rows={2} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput control={form.control} name="contact" label="تلفن تماس" placeholder="۰۲۱…" />
          <FormInput control={form.control} name="email" label="ایمیل" placeholder="store@example.com" />
          <FormInput control={form.control} name="workingHours" label="ساعات کاری" placeholder="مثال: ۸ صبح تا ۵ عصر" />
          <FormSelect control={form.control} name="status" label="وضعیت" placeholder="انتخاب وضعیت" options={statusOptions} required />
        </div>
      </SectionCard>

      <SectionCard
        icon={MapPin}
        iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
        title="موقعیت و مسئولیت"
        description="مسئول فروشگاه، استان، شهر و موقعیت روی نقشه"
      >
        <FormSearchSelect
          control={form.control}
          name="storeHeadId"
          label="مسئول فروشگاه"
          placeholder="جستجوی کاربر…"
          fetcher={usersFetcher}
          displayLabel={
            item?.storeHead
              ? [item.storeHead.first_name, item.storeHead.last_name].filter(Boolean).join(" ")
              : undefined
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSearchSelect
            control={form.control}
            name="stateId"
            label="استان"
            placeholder="جستجوی استان…"
            fetcher={statesFetcher}
            displayLabel={item?.state?.name}
          />
          <FormSearchSelect
            control={form.control}
            name="cityId"
            label="شهر"
            placeholder="جستجوی شهر…"
            fetcher={citiesFetcher}
            displayLabel={item?.city?.name}
          />
        </div>
        <div className="space-y-2.5">
          <p className="text-body-sm font-medium text-moonlight">موقعیت روی نقشه</p>
          <LocationPicker value={geoLocation} onChange={setGeoLocation} />
        </div>
      </SectionCard>

      <SectionCard
        icon={Boxes}
        iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
        title="انواع کالا"
        description="انواع کالایی که فروشگاه توانایی تأمین آن را دارد"
      >
        <FormSearchMultiSelect
          control={form.control}
          name="wareTypeIds"
          label="انواع کالا"
          placeholder="انواع کالای قابل تأمین را انتخاب کنید…"
          fetcher={wareTypesFetcher}
          nameMap={nameMap}
          onSelectData={(option) => setNameMap((prev) => ({ ...prev, [option._id]: option.name }))}
        />
      </SectionCard>

      <SectionCard
        icon={BadgeInfo}
        iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
        title="مشخصات حقوقی"
        description="کد اقتصادی، شناسه ملی، شماره ثبت"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormInput control={form.control} name="economicCode" label="کد اقتصادی" />
          <FormInput control={form.control} name="nationalId" label="شناسه ملی" />
          <FormInput control={form.control} name="registerNumber" label="شماره ثبت" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput control={form.control} name="legalPerson" label="شخص حقوقی" />
          <FormInput control={form.control} name="certificateNumber" label="شماره گواهی" />
          <FormInput control={form.control} name="postalCode" label="کد پستی" />
        </div>
      </SectionCard>

      <SectionCard
        icon={Banknote}
        iconClassName="bg-violet-500/10 text-violet-400 ring-violet-500/15"
        title="اطلاعات بانکی"
        description="شماره کارت، شبا، نام صاحب حساب"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput control={form.control} name="bankCardNumber" label="شماره کارت" />
          <FormInput control={form.control} name="shebaNumber" label="شماره شبا" />
          <FormInput control={form.control} name="nameOfAccountHolder" label="نام صاحب حساب" />
          <FormInput control={form.control} name="bankName" label="نام بانک" />
        </div>
      </SectionCard>

      <SectionCard
        icon={Shield}
        iconClassName="bg-ember/10 text-ember ring-ember/15"
        title="تنظیمات دیگر"
        description="امتیاز، تحویل سریع، فعالیت در تعطیلات"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput control={form.control} name="score" label="امتیاز" placeholder="۰" type="number" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormCheckbox control={form.control} name="fastDelivery" label="تحویل سریع" />
          <FormCheckbox control={form.control} name="isAvailableInHolidays" label="فعال در تعطیلات" />
        </div>
      </SectionCard>
    </EntityFormShell>
  )
}
