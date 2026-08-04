"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Building2, GitBranch, MapPin, MapPinned, Loader2, Check, X, Warehouse } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { SectionCard } from "@/components/form/section-card"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormSelect } from "@/components/form/form-select"
import { FormSearchSelect } from "@/components/form/form-search-select"
import { LocationPicker } from "@/components/ui/location-picker"
import type { GeoPoint } from "@/components/ui/location-picker"
import { Form } from "@/components/ui/form"
import { add } from "@/app/actions/unit/add"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { getUsers } from "@/app/actions/user/getUsers"
import type { ReqType } from "@/types/declarations/selectInp"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const unitSchema = z.object({
  name: z.string().min(1, "نام واحد الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  type: z.string().min(1, "نوع واحد الزامی است"),
  isActive: z.boolean(),
  parentUnitId: z.string().optional(),
  headId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  warehouseCapacity: z.coerce.number().optional(),
  hasColdStorage: z.boolean().optional(),
  fleetSize: z.coerce.number().optional(),
  serviceRadius: z.coerce.number().optional(),
})

type UnitData = z.infer<typeof unitSchema>

const unitTypeOptions = [
  { value: "General", label: "عمومی" },
  { value: "Warehouse", label: "انبار" },
  { value: "Logistics", label: "تدارکات" },
  { value: "Production", label: "تولید" },
  { value: "Administration", label: "اداری" },
  { value: "Finance", label: "مالی" },
  { value: "Expert", label: "کارشناسی" },
]

export default function AddUnitPage() {
  const router = useRouter()
  const [geoLocation, setGeoLocation] = useState<GeoPoint>(null)

  const form = useForm<UnitData>({
    resolver: zodV4Resolver(unitSchema),
    defaultValues: {
      name: "",
      enName: "",
      description: "",
      type: "",
      isActive: true,
      parentUnitId: "",
      headId: "",
      address: "",
      phone: "",
      email: "",
      warehouseCapacity: undefined,
      hasColdStorage: false,
      fleetSize: undefined,
      serviceRadius: undefined,
    },
  })

  const selectedType = form.watch("type")

  const onSubmit = async (data: UnitData) => {
    try {
      const result = await add(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          name: data.name,
          enName: data.enName || undefined,
          description: data.description || undefined,
          type: data.type as ReqType["main"]["unit"]["add"]["set"]["type"],
          isActive: data.isActive,
          parentUnitId: data.parentUnitId || undefined,
          headId: data.headId || undefined,
          address: data.address || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          warehouseCapacity: data.warehouseCapacity || undefined,
          hasColdStorage: data.hasColdStorage || undefined,
          fleetSize: data.fleetSize || undefined,
          serviceRadius: data.serviceRadius || undefined,
          ...(geoLocation ? { location: geoLocation } : {}),
        },
        { _id: 1, name: 1 },
      )
      if (result.success) {
        toast.success("واحد با موفقیت ایجاد شد")
        router.push("/orghead/units")
      } else {
        toast.error(result.body?.message || "خطا در ایجاد واحد")
      }
    } catch {
      toast.error("خطا در ایجاد واحد")
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="افزودن واحد"
        description="اطلاعات واحد را وارد کنید؛ پس از ایجاد، می‌توانید سرپرست و زیرواحدها را تعریف کنید."
      >
        <Link href="/orghead/units">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به واحدها
          </Button>
        </Link>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <SectionCard
            icon={Building2}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="اطلاعات اصلی"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="name"
                label="نام واحد"
                placeholder="مثال: واحد تدارکات"
                required
                disabled={submitting}
              />
              <FormSelect
                control={form.control}
                name="type"
                label="نوع واحد"
                placeholder="انتخاب نوع…"
                options={unitTypeOptions}
                required
                disabled={submitting}
              />
            </div>
            <FormInput
              control={form.control}
              name="enName"
              label="نام انگلیسی"
              placeholder="Example: Procurement Unit"
              disabled={submitting}
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="توضیحات"
              placeholder="توضیحات مختصری درباره واحد…"
              rows={3}
              disabled={submitting}
            />
            <FormCheckbox control={form.control} name="isActive" label="فعال" disabled={submitting} />
          </SectionCard>

          <SectionCard
            icon={GitBranch}
            iconClassName="bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
            title="ساختار"
            description="واحد والد و سرپرست واحد را مشخص کنید."
          >
            <FormSearchSelect
              control={form.control}
              name="parentUnitId"
              label="واحد والد"
              placeholder="انتخاب واحد والد…"
              disabled={submitting}
              fetcher={async (search?: string) => {
                const result = await getUnits(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                  { _id: 1, name: 1 },
                )
                if (!result.success || !result.body) return []
                return result.body.map((u: { _id?: string; name?: string }) => ({
                  _id: u._id || "",
                  name: u.name || "",
                }))
              }}
            />
            <FormSearchSelect
              control={form.control}
              name="headId"
              label="سرپرست واحد"
              placeholder="انتخاب سرپرست…"
              disabled={submitting}
              fetcher={async (search?: string) => {
                const result = await getUsers(
                  { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 50, search: search || undefined },
                  { _id: 1, first_name: 1, last_name: 1 },
                )
                if (!result.success || !result.body) return []
                return result.body.map((u: { _id?: string; first_name?: string; last_name?: string }) => ({
                  _id: u._id || "",
                  name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—",
                }))
              }}
            />
          </SectionCard>

          <SectionCard
            icon={MapPin}
            iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15"
            title="اطلاعات تماس"
          >
            <FormInput
              control={form.control}
              name="address"
              label="آدرس"
              placeholder="آدرس واحد…"
              disabled={submitting}
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormInput
                control={form.control}
                name="phone"
                label="تلفن"
                placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                disabled={submitting}
              />
              <FormInput
                control={form.control}
                name="email"
                label="ایمیل"
                placeholder="unit@example.com"
                disabled={submitting}
              />
            </div>
          </SectionCard>

          {selectedType === "Warehouse" && (
            <SectionCard
              icon={Warehouse}
              iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
              title="ویژگی‌های انبار"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormInput
                  control={form.control}
                  name="warehouseCapacity"
                  label="ظرفیت انبار (متر مربع)"
                  type="number"
                  placeholder="مثال: ۱۰۰۰"
                  disabled={submitting}
                />
                <FormInput
                  control={form.control}
                  name="fleetSize"
                  label="تعداد ناوگان"
                  type="number"
                  placeholder="مثال: ۵"
                  disabled={submitting}
                />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormCheckbox
                  control={form.control}
                  name="hasColdStorage"
                  label="دارای سردخانه"
                  disabled={submitting}
                />
                <FormInput
                  control={form.control}
                  name="serviceRadius"
                  label="شعاع سرویس (کیلومتر)"
                  type="number"
                  placeholder="مثال: ۵۰"
                  disabled={submitting}
                />
              </div>
            </SectionCard>
          )}

          <SectionCard
            icon={MapPinned}
            iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15"
            title="موقعیت جغرافیایی"
          >
            <LocationPicker value={geoLocation} onChange={setGeoLocation} />
          </SectionCard>

          <div className="sticky bottom-0 z-10">
            <div className="glass-card-conic-top flex flex-col-reverse gap-4 rounded-xl border border-white/8 bg-graphite-plate/70 p-5 shadow-[0_32px_64px_-32px_rgba(5,6,15,0.9),0_0_40px_-16px_rgba(182,217,252,0.2)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <p className="hidden text-caption text-fog/60 sm:block">
                فیلدهای ستاره‌دار الزامی هستند
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="flex-1 gap-2 px-5 sm:flex-none"
                >
                  {submitting ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Check className="size-5" />
                  )}
                  ثبت واحد
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={submitting}
                  onClick={() => router.push("/orghead/units")}
                  className="gap-2 px-5"
                >
                  <X className="size-5" />
                  انصراف
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
