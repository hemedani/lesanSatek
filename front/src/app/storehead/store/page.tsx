"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { Loader2, Save, Store, Banknote, BadgeInfo, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { useAuthStore } from "@/stores/authStore"
import { get } from "@/app/actions/store/get"
import { update } from "@/app/actions/store/update"
import { LocationPicker } from "@/components/ui/location-picker"
import type { GeoPoint } from "@/components/ui/location-picker"

const storeSchema = z.object({
  name: z.string().min(1, "نام فروشگاه الزامی است"),
  address: z.string().optional(),
  contact: z.string().optional(),
  ceoname: z.string().optional(),
  workingHours: z.string().optional(),
  email: z.string().optional(),
  economicCode: z.string().optional(),
  postalCode: z.string().optional(),
  nationalId: z.string().optional(),
  bankCardNumber: z.string().optional(),
  shebaNumber: z.string().optional(),
  nameOfAccountHolder: z.string().optional(),
  bankName: z.string().optional(),
})

type StoreData = z.input<typeof storeSchema>

export default function StoreProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [geoLocation, setGeoLocation] = useState<GeoPoint>(null)
  const { user, activeRoleId } = useAuthStore()

  const activeRole = user?.roles?.find((r) => r.roleId === activeRoleId)
  const storeId = activeRole?.scopeId

  const form = useForm<StoreData>({
    resolver: zodV4Resolver(storeSchema),
    defaultValues: {
      name: "", address: "", contact: "", ceoname: "", workingHours: "", email: "",
      economicCode: "", postalCode: "", nationalId: "", bankCardNumber: "",
      shebaNumber: "", nameOfAccountHolder: "", bankName: "",
    },
  })

  useEffect(() => {
    if (!storeId) {
      setNotFound(true)
      setLoading(false)
      return
    }
    ;(async () => {
      const result = await get({ activeRoleId: "", _id: storeId }, {
        _id: 1, name: 1, address: 1, contact: 1, ceoname: 1,
        workingHours: 1, email: 1, economicCode: 1, postalCode: 1,
        nationalId: 1, bankCardNumber: 1, shebaNumber: 1,
        nameOfAccountHolder: 1, bankName: 1, geoLocation: 1,
      })
      if (result.success && result.body?.[0]) {
        const s = result.body[0]
        if (s.geoLocation) setGeoLocation(s.geoLocation)
        form.reset({
          name: s.name || "",
          address: s.address || "",
          contact: s.contact || "",
          ceoname: s.ceoname || "",
          workingHours: s.workingHours || "",
          email: s.email || "",
          economicCode: s.economicCode || "",
          postalCode: s.postalCode || "",
          nationalId: s.nationalId || "",
          bankCardNumber: s.bankCardNumber || "",
          shebaNumber: s.shebaNumber || "",
          nameOfAccountHolder: s.nameOfAccountHolder || "",
          bankName: s.bankName || "",
        })
      } else {
        setNotFound(true)
      }
      setLoading(false)
    })()
  }, [storeId, form])

  const onSubmit = async (values: StoreData) => {
    if (!storeId) return
    setSubmitting(true)
    try {
      const result = await update(
        {
          activeRoleId: "",
          _id: storeId,
          name: values.name,
          address: values.address || undefined,
          contact: values.contact || undefined,
          ceoname: values.ceoname || undefined,
          workingHours: values.workingHours || undefined,
          email: values.email || undefined,
          economicCode: values.economicCode || undefined,
          postalCode: values.postalCode || undefined,
          nationalId: values.nationalId || undefined,
          bankCardNumber: values.bankCardNumber || undefined,
          shebaNumber: values.shebaNumber || undefined,
          nameOfAccountHolder: values.nameOfAccountHolder || undefined,
          bankName: values.bankName || undefined,
          ...(geoLocation ? { geoLocation } : {}),
        },
        { _id: 1, name: 1 },
      )
      if (result.success) {
        toast.success("فروشگاه با موفقیت به‌روزرسانی شد.")
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی فروشگاه")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی فروشگاه")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <ErrorState title="فروشگاه یافت نشد" message="فروشگاه شما یافت نشد." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-glacier">مدیریت فروشگاه</h1>
        <p className="text-sm text-fog mt-1">به‌روزرسانی اطلاعات فروشگاه شما</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Store className="size-4.5 text-electric-iris" />
                </div>
                <CardTitle>اطلاعات فروشگاه</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput control={form.control} name="name" label="نام فروشگاه" required />
                <FormInput control={form.control} name="ceoname" label="نام مدیر" />
              </div>
              <FormTextarea control={form.control} name="address" label="آدرس" rows={2} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput control={form.control} name="contact" label="تلفن تماس" />
                <FormInput control={form.control} name="email" label="ایمیل" />
                <FormInput control={form.control} name="workingHours" label="ساعات کاری" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <BadgeInfo className="size-4.5 text-electric-iris" />
                </div>
                <CardTitle>مشخصات حقوقی</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput control={form.control} name="economicCode" label="کد اقتصادی" />
                <FormInput control={form.control} name="nationalId" label="شناسه ملی" />
                <FormInput control={form.control} name="postalCode" label="کد پستی" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <Banknote className="size-4.5 text-electric-iris" />
                </div>
                <CardTitle>اطلاعات بانکی</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput control={form.control} name="bankCardNumber" label="شماره کارت" />
                <FormInput control={form.control} name="shebaNumber" label="شماره شبا" />
                <FormInput control={form.control} name="nameOfAccountHolder" label="نام صاحب حساب" />
                <FormInput control={form.control} name="bankName" label="نام بانک" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
                  <MapPin className="size-4.5 text-electric-iris" />
                </div>
                <CardTitle>موقعیت جغرافیایی</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <LocationPicker value={geoLocation} onChange={setGeoLocation} />
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={submitting} className="gap-2 min-w-[160px]">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {submitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
