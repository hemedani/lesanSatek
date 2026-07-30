"use client"

import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState, useCallback, useEffect } from "react"
import { Loader2, ArrowRight, Package, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FormSearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { add } from "@/app/actions/stuff/add"
import { gets as getWares } from "@/app/actions/ware/gets"
import { get as getWare } from "@/app/actions/ware/get"
import { useAuthStore } from "@/stores/authStore"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"

const stuffSchema = z.object({
  quantity: z.string().min(1, "تعداد الزامی است"),
  price: z.string().optional(),
  hasAbsolutePrice: z.enum(["absolute", "percentage"]),
  pricePercentage: z.string().optional(),
  wareId: z.string().min(1, "انتخاب کالا الزامی است"),
  wareTypeId: z.string().optional(),
  wareClassId: z.string().optional(),
  wareGroupId: z.string().optional(),
  wareModelId: z.string().optional(),
  expiration: z.string().optional(),
  barcode: z.string().optional(),
  qrc: z.string().optional(),
  availableLongPayment: z.string().optional(),
  twoMonthPricePercent: z.string().optional(),
  threeMonthPricePercent: z.string().optional(),
  fourMonthPricePercent: z.string().optional(),
  fiveMonthPricePercent: z.string().optional(),
  sixMonthPricePercent: z.string().optional(),
  sevenMonthPricePercent: z.string().optional(),
  eightMonthPricePercent: z.string().optional(),
  nineMonthPricePercent: z.string().optional(),
  tenMonthPricePercent: z.string().optional(),
  elevenMonthPricePercent: z.string().optional(),
  twelveMonthPricePercent: z.string().optional(),
  eighteenMonthPricePercent: z.string().optional(),
  twentyFourMonthPricePercent: z.string().optional(),
  twoMonth: z.string().optional(),
  threeMonth: z.string().optional(),
  fourMonth: z.string().optional(),
  fiveMonth: z.string().optional(),
  sixMonth: z.string().optional(),
  sevenMonth: z.string().optional(),
  eightMonth: z.string().optional(),
  nineMonth: z.string().optional(),
  tenMonth: z.string().optional(),
  elevenMonth: z.string().optional(),
  twelveMonth: z.string().optional(),
  eighteenMonth: z.string().optional(),
  twentyFourMonth: z.string().optional(),
})

type StuffData = z.infer<typeof stuffSchema>

const wareFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getWares(
    { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q },
    { _id: 1, name: 1, enName: 1, brand: 1, price: 1 },
  )
  if (!result.success) return []
  return result.body.map((s: { _id: string; name?: string; enName?: string; brand?: string; price?: number }) => ({
    _id: s._id,
    name: s.name || s.enName || "",
    sublabel: s.brand || (s.price != null ? `${s.price.toLocaleString("fa-IR")} ریال` : undefined),
  }))
}

const MONTH_OPTIONS = [
  { value: "two", label: "۲ ماهه", percentKey: "twoMonthPricePercent", priceKey: "twoMonth" },
  { value: "three", label: "۳ ماهه", percentKey: "threeMonthPricePercent", priceKey: "threeMonth" },
  { value: "four", label: "۴ ماهه", percentKey: "fourMonthPricePercent", priceKey: "fourMonth" },
  { value: "five", label: "۵ ماهه", percentKey: "fiveMonthPricePercent", priceKey: "fiveMonth" },
  { value: "six", label: "۶ ماهه", percentKey: "sixMonthPricePercent", priceKey: "sixMonth" },
  { value: "seven", label: "۷ ماهه", percentKey: "sevenMonthPricePercent", priceKey: "sevenMonth" },
  { value: "eight", label: "۸ ماهه", percentKey: "eightMonthPricePercent", priceKey: "eightMonth" },
  { value: "nine", label: "۹ ماهه", percentKey: "nineMonthPricePercent", priceKey: "nineMonth" },
  { value: "ten", label: "۱۰ ماهه", percentKey: "tenMonthPricePercent", priceKey: "tenMonth" },
  { value: "eleven", label: "۱۱ ماهه", percentKey: "elevenMonthPricePercent", priceKey: "elevenMonth" },
  { value: "twelve", label: "۱۲ ماهه", percentKey: "twelveMonthPricePercent", priceKey: "twelveMonth" },
  { value: "eighteen", label: "۱۸ ماهه", percentKey: "eighteenMonthPricePercent", priceKey: "eighteenMonth" },
  { value: "twentyFour", label: "۲۴ ماهه", percentKey: "twentyFourMonthPricePercent", priceKey: "twentyFourMonth" },
]

export default function AddStuffPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [showLongPayment, setShowLongPayment] = useState(false)
  const [selectedWare, setSelectedWare] = useState<{ price?: number; name?: string } | null>(null)
  const [wareBasePrice, setWareBasePrice] = useState<number>(0)
  const { user, activeRoleId } = useAuthStore()

  const activeRole = user?.roles?.find((r) => r.roleId === activeRoleId)
  const storeId = activeRole?.scopeId

  const form = useForm<StuffData>({
    resolver: zodV4Resolver(stuffSchema),
    defaultValues: {
      quantity: "",
      price: "",
      hasAbsolutePrice: "absolute",
      pricePercentage: "",
      wareId: "",
      wareTypeId: "",
      wareClassId: "",
      wareGroupId: "",
      wareModelId: "",
      expiration: "",
      barcode: "",
      qrc: "",
      availableLongPayment: "",
    },
  })

  const pricingMode = form.watch("hasAbsolutePrice")
  const pricePercentage = form.watch("pricePercentage")
  const enteredPrice = form.watch("price")

  const computedPrice = pricingMode === "percentage" && wareBasePrice > 0 && pricePercentage
    ? wareBasePrice * (1 + Number(pricePercentage) / 100)
    : pricingMode === "percentage"
      ? 0
      : Number(enteredPrice) || 0

  const wareId = form.watch("wareId")

  const handleWareChange = useCallback(async (id: string) => {
    if (!id) {
      setSelectedWare(null)
      setWareBasePrice(0)
      return
    }
    const result = await getWare(
      { activeRoleId: getActiveRoleIdFromStore(), _id: id },
      {
        _id: 1,
        name: 1,
        price: 1,
        wareType: { _id: 1 },
        wareClass: { _id: 1 },
        wareGroup: { _id: 1 },
        wareModel: { _id: 1 },
      },
    )
    if (result.success && result.body?.[0]) {
      const w = result.body[0]
      setSelectedWare(w)
      setWareBasePrice(w.price || 0)
      if (w.wareType?._id) form.setValue("wareTypeId", w.wareType._id)
      if (w.wareClass?._id) form.setValue("wareClassId", w.wareClass._id)
      if (w.wareGroup?._id) form.setValue("wareGroupId", w.wareGroup._id)
      if (w.wareModel?._id) form.setValue("wareModelId", w.wareModel._id)
    }
  }, [form])

  useEffect(() => {
    if (wareId) {
      handleWareChange(wareId)
    }
  }, [wareId, handleWareChange])

  const onSubmit = async (data: StuffData) => {
    if (!storeId) {
      toast.error("فروشگاه شما یافت نشد")
      return
    }
    if (pricingMode === "absolute" && !data.price) {
      toast.error("لطفاً قیمت را وارد کنید")
      return
    }
    if (pricingMode === "percentage" && !data.pricePercentage) {
      toast.error("لطفاً درصد افزایش را وارد کنید")
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        quantity: Number(data.quantity) || 0,
        price: pricingMode === "percentage" ? Math.round(computedPrice) : Number(data.price) || 0,
        hasAbsolutePrice: pricingMode === "absolute",
        pricePercentage: data.pricePercentage ? Number(data.pricePercentage) : undefined,
        wareId: data.wareId,
        storeId,
        isBarcodeSet: !!data.barcode,
        isQrcSet: !!data.qrc,
        wareTypeId: data.wareTypeId,
        wareClassId: data.wareClassId,
        wareGroupId: data.wareGroupId,
        wareModelId: data.wareModelId,
      }

      if (data.expiration) payload.expiration = new Date(data.expiration).toISOString()
      if (data.barcode) payload.barcode = Number(data.barcode)
      if (data.qrc) payload.qrc = data.qrc
      if (data.availableLongPayment) payload.availableLongPayment = data.availableLongPayment

      for (const opt of MONTH_OPTIONS) {
        const percentVal = data[opt.percentKey as keyof StuffData]
        const priceVal = data[opt.priceKey as keyof StuffData]
        if (percentVal) payload[opt.percentKey] = Number(percentVal)
        if (priceVal) payload[opt.priceKey] = Number(priceVal)
      }

      const result = await add(payload as any, { _id: 1, quantity: 1 })
      if (result.success) {
        toast.success("کالا با موفقیت اضافه شد")
        router.push("/storehead/stuff")
      } else {
        toast.error(result.body?.message || "خطا در افزودن کالا")
      }
    } catch {
      toast.error("خطا در افزودن کالا")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push("/storehead/stuff")} className="rounded-lg">
          <ArrowRight className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-glacier">کالای جدید</h1>
          <p className="text-sm text-fog mt-1">افزودن کالای جدید به فروشگاه شما</p>
        </div>
      </div>

      <Card variant="glass">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-electric-iris/10 flex items-center justify-center">
              <Package className="size-4.5 text-electric-iris" />
            </div>
            <CardTitle className="text-base font-medium text-frost-link">اطلاعات کالا</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormSearchSelect control={form.control} name="wareId" label="کالا" placeholder="کالا را انتخاب کنید..." fetcher={wareFetcher} required />

              {selectedWare && (
                <div className="rounded-lg bg-white/[0.02] border border-steel-border/30 p-3 text-sm space-y-1">
                  <div className="flex justify-between text-fog">
                    <span>قیمت پایه کالا</span>
                    <span className="text-moonlight font-mono" dir="ltr">
                      {wareBasePrice.toLocaleString("fa-IR")} ریال
                    </span>
                  </div>
                  {selectedWare.name && (
                    <div className="flex justify-between text-fog">
                      <span>نام کالا</span>
                      <span className="text-moonlight">{selectedWare.name}</span>
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تعداد<span className="text-destructive ms-1">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="۵۰" dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="bg-steel-border/20" />

              <div className="space-y-3">
                <p className="text-sm font-medium text-moonlight">نحوه قیمت‌گذاری</p>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pricingMode"
                      value="absolute"
                      checked={form.watch("hasAbsolutePrice") === "absolute"}
                      onChange={() => form.setValue("hasAbsolutePrice", "absolute")}
                      className="size-4 accent-electric-iris"
                    />
                    <span className="text-sm text-fog">قیمت مطلق</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pricingMode"
                      value="percentage"
                      checked={form.watch("hasAbsolutePrice") === "percentage"}
                      onChange={() => form.setValue("hasAbsolutePrice", "percentage")}
                      className="size-4 accent-electric-iris"
                    />
                    <span className="text-sm text-fog">درصد افزایش</span>
                  </label>
                </div>

                {pricingMode === "absolute" ? (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قیمت نهایی (ریال)<span className="text-destructive ms-1">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="۲۸۰۰۰۰۰" dir="rtl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="pricePercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>درصد افزایش<span className="text-destructive ms-1">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.1" placeholder="۱۵" dir="rtl" {...field} />
                        </FormControl>
                        <FormDescription className="text-[11px] text-fog/50">
                          درصدی به قیمت پایه کالا اضافه می‌شود
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-fog/70">قیمت محاسبه شده</span>
                    <span className="text-emerald-400 font-medium font-mono" dir="ltr">
                      {computedPrice > 0 ? `${computedPrice.toLocaleString("fa-IR")} ریال` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="bg-steel-border/20" />

              <div className="space-y-4">
                <p className="text-sm font-medium text-moonlight">سایر مشخصات</p>

                <FormJalaliDatePicker control={form.control} name="expiration" label="تاریخ انقضا" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>بارکد</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="۱۲۳۴۵۶۷۸۹" dir="rtl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="qrc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>QR کد</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." dir="rtl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="bg-steel-border/20" />

              <div>
                <button
                  type="button"
                  onClick={() => setShowLongPayment(!showLongPayment)}
                  className="flex items-center gap-2 text-sm text-frost-link hover:text-frost-link/80 transition-colors cursor-pointer"
                >
                  {showLongPayment ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  پرداخت بلند مدت
                </button>

                {showLongPayment && (
                  <div className="mt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="availableLongPayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان پرداخت بلند مدت</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: ۱۲ ماهه" dir="rtl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {MONTH_OPTIONS.map((opt) => (
                        <div key={opt.value} className="rounded-lg bg-white/[0.02] border border-steel-border/20 p-3 space-y-3">
                          <p className="text-xs font-medium text-fog/70">{opt.label}</p>
                          <FormField
                            control={form.control}
                            name={opt.percentKey as any}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] text-fog/50">درصد</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" step="0.1" placeholder="۲۰" dir="rtl" className="h-8" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={opt.priceKey as any}
                            render={({ field }) => (
                              <FormItem className="space-y-1">
                                <FormLabel className="text-[10px] text-fog/50">قیمت (ریال)</FormLabel>
                                <FormControl>
                                  <Input type="number" min="0" placeholder="۵۰۰۰۰۰" dir="rtl" className="h-8" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1 gap-2">
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {submitting ? "در حال ذخیره..." : "افزودن کالا"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/storehead/stuff")} disabled={submitting}>
                  انصراف
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
