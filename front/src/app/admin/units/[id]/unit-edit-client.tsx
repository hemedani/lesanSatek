"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowRight, Building2, MapPin, MapPinned, Loader2, Check, X, Share2, Trash2, Warehouse } from "lucide-react"
import { cn } from "@/lib/utils"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormCheckbox } from "@/components/form/form-checkbox"
import { FormSelect } from "@/components/form/form-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { LocationPicker } from "@/components/ui/location-picker"
import type { GeoPoint } from "@/components/ui/location-picker"
import { update } from "@/app/actions/unit/update"
import { remove } from "@/app/actions/unit/remove"
import type { ReqType } from "@/types/declarations/selectInp"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

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

interface UnitEditFormProps {
  unit: {
    _id: string
    name?: string
    enName?: string
    description?: string
    type?: string
    isActive?: boolean
    address?: string
    phone?: string
    email?: string
    warehouseCapacity?: number
    hasColdStorage?: boolean
    fleetSize?: number
    serviceRadius?: number
    location?: GeoPoint
  }
}

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  children,
}: {
  icon: React.ElementType
  iconClassName?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <Card variant="glass" className="[--card-spacing:--spacing(6)]">
      <CardHeader className="pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20",
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

export function UnitEditClient({ unit }: UnitEditFormProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [geoLocation, setGeoLocation] = useState<GeoPoint>(unit.location || null)

  const form = useForm<UnitData>({
    resolver: zodV4Resolver(unitSchema),
    defaultValues: {
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
    },
  })

  const selectedType = form.watch("type")

  const onSubmit = async (data: UnitData) => {
    try {
      const result = await update(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: unit._id,
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
    setDeleting(true)
    try {
      const result = await remove({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: unit._id,
      })
      if (result.success) {
        toast.success("واحد با موفقیت حذف شد")
        router.push("/admin/units")
      } else {
        toast.error(result.body?.message || "خطا در حذف واحد")
        setDeleting(false)
      }
    } catch {
      toast.error("خطا در حذف واحد")
      setDeleting(false)
    }
  }

  const submitting = form.formState.isSubmitting

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title={unit.name || "ویرایش واحد"}
        description="ویرایش اطلاعات واحد"
      >
        <div className="flex items-center gap-2">
          <HelpLauncher topicId="admin-unit-edit" tooltip="راهنمای ویرایش واحد" />
          <Link href="/admin/units">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به واحدها
            </Button>
          </Link>
          <Link href={`/admin/units/${unit._id}/relations`}>
            <Button variant="ghost" className="gap-2 px-4">
              <Share2 className="size-5" />
              ویرایش روابط
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
        </div>
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
                  onClick={() => router.push("/admin/units")}
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
        loading={deleting}
      />
    </div>
  )
}
