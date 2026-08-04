"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Building2, MapPin, MapPinned, Loader2, Check, X, Trash2, Warehouse } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormSelect } from "@/components/form/form-select"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { SectionCard } from "@/components/form/section-card"
import { PageHeader } from "@/components/ui/page-header"
import { Form } from "@/components/ui/form"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ErrorState } from "@/components/ui/error-state"
import { LocationPicker } from "@/components/ui/location-picker"
import type { GeoPoint } from "@/components/ui/location-picker"
import { get } from "@/app/actions/unit/get"
import { update } from "@/app/actions/unit/update"
import { remove } from "@/app/actions/unit/remove"
import type { ReqType } from "@/types/declarations/selectInp"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import Link from "next/link"

const unitSchema = z.object({
  name: z.string().min(1, "نام واحد الزامی است"),
  enName: z.string().optional(),
  description: z.string().optional(),
  type: z.string().min(1, "نوع واحد الزامی است"),
  isActive: z.boolean(),
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

export default function EditUnitPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [unitName, setUnitName] = useState("")
  const [geoLocation, setGeoLocation] = useState<GeoPoint>(null)

  const form = useForm<UnitData>({
    resolver: zodV4Resolver(unitSchema),
    defaultValues: {
      name: "",
      enName: "",
      description: "",
      type: "",
      isActive: true,
      address: "",
      phone: "",
      email: "",
      warehouseCapacity: undefined,
      hasColdStorage: false,
      fleetSize: undefined,
      serviceRadius: undefined,
    },
  })

  useEffect(() => {
    const load = async () => {
      const result = await get(
        { activeRoleId: getActiveRoleIdFromStore(), _id: id },
        {
          _id: 1,
          name: 1,
          enName: 1,
          description: 1,
          type: 1,
          isActive: 1,
          address: 1,
          phone: 1,
          email: 1,
          warehouseCapacity: 1,
          hasColdStorage: 1,
          fleetSize: 1,
          serviceRadius: 1,
          location: 1,
        },
      )
      if (result.success && result.body?.[0]) {
        const unit = result.body[0]
        setUnitName(unit.name || "")
        setGeoLocation(unit.location || null)
        form.reset({
          name: unit.name || "",
          enName: unit.enName || "",
          description: unit.description || "",
          type: unit.type || "",
          isActive: unit.isActive ?? true,
          address: unit.address || "",
          phone: unit.phone || "",
          email: unit.email || "",
          warehouseCapacity: unit.warehouseCapacity ?? undefined,
          hasColdStorage: unit.hasColdStorage ?? false,
          fleetSize: unit.fleetSize ?? undefined,
          serviceRadius: unit.serviceRadius ?? undefined,
        })
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
  }, [form, id])

  const selectedType = form.watch("type")

  const onSubmit = async (data: UnitData) => {
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: id,
          name: data.name,
          enName: data.enName || undefined,
          description: data.description || undefined,
          type: data.type as ReqType["main"]["unit"]["update"]["set"]["type"],
          isActive: data.isActive,
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
        toast.success("واحد با موفقیت به‌روزرسانی شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی واحد")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی واحد")
    }
  }

  const handleDelete = async () => {
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: id })
    if (result.success) {
      toast.success("واحد با موفقیت حذف شد")
      router.push("/orghead/units")
    } else {
      toast.error(result.body?.message || "خطا در حذف واحد")
    }
    setShowDelete(false)
  }

  if (loading) {
    return <LoadingSkeleton type="card" count={1} />
  }

  if (notFound) {
    return (
      <div>
        <ErrorState title="واحد مورد نظر یافت نشد" message="واحدی با این شناسه در سامانه وجود ندارد." />
        <div className="flex justify-center mt-4">
          <Link href="/orghead/units">
            <Button variant="ghost" size="sm" className="text-frost-link">
              <ArrowRight className="size-4 ms-1" />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={unitName || "ویرایش واحد"}
        description="ویرایش اطلاعات واحد"
      >
        <Link href="/orghead/units">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به واحدها
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={() => setShowDelete(true)}
          className="gap-2 px-4 text-ember hover:bg-ember/5 hover:text-ember"
        >
          <Trash2 className="size-5" />
          حذف
        </Button>
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
                  ذخیره تغییرات
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

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف واحد"
        description="آیا از حذف این واحد اطمینان دارید؟ این اقدام قابل بازگشت نیست."
        confirmLabel="حذف"
        onConfirm={handleDelete}
      />
    </div>
  )
}
