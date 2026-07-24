"use client"

import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2, Package, Clock, Banknote } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { submit as submitOffer } from "@/app/actions/tenderOffer/submit"
import { gets as getMyOffers } from "@/app/actions/tenderOffer/gets"
import { get as getTender } from "@/app/actions/tender/get"
import { gets as getWares } from "@/app/actions/ware/gets"
import { useAuthStore } from "@/stores/authStore"

interface WareItem {
  _id: string
  name?: string
  enName?: string
  brand?: string
  manufacturer?: { _id: string; name?: string }
  price?: number
}

interface ExistingOffer {
  _id: string
  price?: number
  deliveryTime?: number
  paymentTerms?: string
  description?: string
  status?: string
  submittedAt?: string
  ware?: { _id: string; name?: string; brand?: string }
}

const offerSchema = z.object({
  wareId: z.string().min(1, "انتخاب کالا الزامی است"),
  price: z.string().min(1, "قیمت پیشنهادی الزامی است"),
  deliveryTime: z.string().min(1, "زمان تحویل الزامی است"),
  paymentTerms: z.string().optional(),
  description: z.string().optional(),
})

type OfferData = z.infer<typeof offerSchema>

const statusMap: Record<string, { label: string; className: string }> = {
  submitted: { label: "در انتظار بررسی", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  accepted: { label: "پذیرفته شده", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "رد شده", className: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
}

export default function SubmitStoreOfferPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [tenderId, setTenderId] = useState<string | null>(null)
  const [wares, setWares] = useState<WareItem[]>([])
  const [waresLoading, setWaresLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingOffers, setExistingOffers] = useState<ExistingOffer[]>([])
  const [loadingOffers, setLoadingOffers] = useState(true)
  const { user, activeRoleId } = useAuthStore()

  useEffect(() => {
    paramsPromise.then((p) => setTenderId(p.id))
  }, [paramsPromise])

  const activeRole = user?.roles?.find((r) => r.roleId === activeRoleId)
  const storeId = activeRole?.scopeId

  // Load existing offers for this tender
  useEffect(() => {
    if (!tenderId) return

    const loadExistingOffers = async () => {
      setLoadingOffers(true)
      try {
        const result = await getMyOffers(
          { page: 1, limit: 50, tenderId } as any,
          {
            _id: 1,
            price: 1,
            deliveryTime: 1,
            paymentTerms: 1,
            description: 1,
            status: 1,
            submittedAt: 1,
            ware: { _id: 1, name: 1, brand: 1 },
          },
        )
        if (result.success) {
          setExistingOffers(result.body || [])
        }
      } catch {
        // Silently fail — user can still submit
      } finally {
        setLoadingOffers(false)
      }
    }

    loadExistingOffers()
  }, [tenderId])

  // Load wares
  useEffect(() => {
    if (!tenderId || !activeRoleId) return

    const loadWares = async () => {
      setWaresLoading(true)
      try {
        const tenderRes = await getTender(
          { activeRoleId: activeRoleId || "", _id: tenderId },
          {
            _id: 1,
            purchasingRequest: {
              _id: 1,
              wareModel: { _id: 1, name: 1 },
            },
          },
        )
        const tender = tenderRes.body?.[0]
        const wareModelId = tender?.purchasingRequest?.wareModel?._id
        if (!wareModelId) {
          setWares([])
          return
        }

        const waresRes = await getWares(
          { activeRoleId: activeRoleId || "", wareModelId, page: 1, limit: 100 },
          {
            _id: 1,
            name: 1,
            enName: 1,
            brand: 1,
            manufacturer: { _id: 1, name: 1 },
            price: 1,
          },
        )
        if (waresRes.success) {
          setWares(waresRes.body || [])
        }
      } catch {
        toast.error("خطا در دریافت اطلاعات")
      } finally {
        setWaresLoading(false)
      }
    }

    loadWares()
  }, [tenderId, activeRoleId])

  const form = useForm<OfferData>({
    resolver: zodV4Resolver(offerSchema),
    defaultValues: {
      wareId: "",
      price: "",
      deliveryTime: "",
      paymentTerms: "",
      description: "",
    },
  })

  const selectedWareId = form.watch("wareId")
  const selectedWare = wares.find((w) => w._id === selectedWareId)

  const onSubmit = async (data: OfferData) => {
    if (!tenderId || !storeId) {
      toast.error("فروشگاه شما یافت نشد")
      return
    }
    setSubmitting(true)
    try {
      const result = await submitOffer(
        {
          activeRoleId: activeRoleId || "",
          tenderId,
          storeId,
          wareId: data.wareId,
          price: Number(data.price),
          deliveryTime: Number(data.deliveryTime),
          paymentTerms: data.paymentTerms || undefined,
          description: data.description || undefined,
          submittedAt: new Date(),
        },
        { _id: 1, price: 1, status: 1, ware: { _id: 1, name: 1, brand: 1 } },
      )

      if (result.success) {
        toast.success("پیشنهاد شما با موفقیت ثبت شد")
        form.reset()
        const updated = await getMyOffers(
          { page: 1, limit: 50, tenderId } as any,
          { _id: 1, price: 1, deliveryTime: 1, paymentTerms: 1, description: 1, status: 1, submittedAt: 1, ware: { _id: 1, name: 1, brand: 1 } },
        )
        if (updated.success) setExistingOffers(updated.body || [])
      } else {
        toast.error(result.body?.message || "خطا در ثبت پیشنهاد")
      }
    } catch {
      toast.error("خطا در ثبت پیشنهاد")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-glacier">ثبت پیشنهاد</h1>
        <p className="text-sm text-fog mt-1">پیشنهاد خود را برای این مناقصه ثبت کنید</p>
      </div>

      {/* Existing offers */}
      {loadingOffers ? (
        <div className="flex items-center justify-center gap-2 py-4 text-fog/50">
          <Loader2 className="size-4 animate-spin" />
          در حال بارگذاری پیشنهادهای قبلی...
        </div>
      ) : existingOffers.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-fog/60">
            پیشنهادهای ثبت شده قبلی شما ({existingOffers.length})
          </p>
          {existingOffers.map((offer) => {
            const statusInfo = statusMap[offer.status || "submitted"] || statusMap.submitted
            return (
              <Card key={offer._id} variant="glass">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="size-4 text-electric-iris shrink-0" />
                        <span className="text-sm font-medium text-moonlight truncate">
                          {offer.ware?.name || "—"}
                        </span>
                        {offer.ware?.brand && (
                          <span className="text-[11px] text-fog/50">{offer.ware.brand}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-fog/50">
                        <span dir="ltr">{offer.price?.toLocaleString("fa-IR")} ریال</span>
                        {offer.deliveryTime && <span>تحویل: {offer.deliveryTime} روز</span>}
                        {offer.paymentTerms && <span>{offer.paymentTerms}</span>}
                      </div>
                      {offer.description && (
                        <p className="text-[11px] text-fog/40 line-clamp-2">{offer.description}</p>
                      )}
                      {offer.submittedAt && (
                        <p className="text-[10px] text-fog/30">
                          {new Date(offer.submittedAt).toLocaleDateString("fa-IR")}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", statusInfo.className)}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}

      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-frost-link leading-6">
            اطلاعات پیشنهاد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="wareId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کالای پیشنهادی</FormLabel>
                    <FormControl>
                      {waresLoading ? (
                        <div className="flex items-center gap-2 h-9 text-sm text-fog/50">
                          <Loader2 className="size-4 animate-spin" />
                          در حال بارگذاری کالاها...
                        </div>
                      ) : wares.length === 0 ? (
                        <div className="h-9 flex items-center text-sm text-fog/50">
                          کالایی برای این مناقصه یافت نشد
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {wares.map((ware) => (
                            <button
                              type="button"
                              key={ware._id}
                              onClick={() => field.onChange(ware._id)}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-lg border text-start transition-all duration-200",
                                field.value === ware._id
                                  ? "border-electric-iris/30 bg-electric-iris/5"
                                  : "border-steel-border/20 bg-transparent hover:border-steel-border/40",
                              )}
                            >
                              <div className={cn(
                                "size-9 rounded-lg flex items-center justify-center shrink-0",
                                field.value === ware._id ? "bg-electric-iris/10" : "bg-white/[0.03]",
                              )}>
                                <Package className="size-4 text-fog/50" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-moonlight truncate">
                                  {ware.name || "—"}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-fog/50">
                                  {ware.brand && <span>{ware.brand}</span>}
                                  {ware.manufacturer?.name && (
                                    <span>{ware.manufacturer.name}</span>
                                  )}
                                </div>
                              </div>
                              {ware.price != null && (
                                <span className="text-xs text-fog/40 shrink-0" dir="ltr">
                                  {ware.price.toLocaleString("fa-IR")} ریال
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedWare && (
                <div className="rounded-sm border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm">
                  <span className="text-emerald-400 font-medium">{selectedWare.name}</span>
                  {selectedWare.brand && (
                    <span className="text-fog/50 text-xs me-2">برند: {selectedWare.brand}</span>
                  )}
                  {selectedWare.price != null && (
                    <span className="text-fog/50 text-xs me-2" dir="ltr">
                      قیمت پایه: {selectedWare.price.toLocaleString("fa-IR")} ریال
                    </span>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قیمت پیشنهادی (تومان)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="۱۰۰۰۰۰۰" dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>زمان تحویل (روز)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="۱۵" dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شرایط پرداخت</FormLabel>
                    <FormControl>
                      <Input placeholder="مثلاً: ۳۰ روزه" dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات</FormLabel>
                    <FormControl>
                      <Textarea placeholder="توضیحات اضافی (اختیاری)" rows={3} dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting || wares.length === 0} className="flex-1 gap-2">
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  ثبت پیشنهاد
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
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
