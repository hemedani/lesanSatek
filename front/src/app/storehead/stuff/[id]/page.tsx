"use client"

import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Loader2, ArrowRight, Package, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/ui/error-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Separator } from "@/components/ui/separator"
import { get } from "@/app/actions/stuff/get"
import { update } from "@/app/actions/stuff/update"
import { remove } from "@/app/actions/stuff/remove"
import { useAuthStore } from "@/stores/authStore"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const stuffSchema = z.object({
  quantity: z.string().min(1, "تعداد الزامی است"),
  price: z.string().min(1, "قیمت الزامی است"),
  expiration: z.string().optional(),
  barcode: z.string().optional(),
  qrc: z.string().optional(),
})

type StuffData = z.infer<typeof stuffSchema>

export default function EditStuffPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { user, activeRoleId } = useAuthStore()

  const activeRole = user?.roles?.find((r) => r.roleId === activeRoleId)
  const storeId = activeRole?.scopeId

  const form = useForm<StuffData>({
    resolver: zodV4Resolver(stuffSchema),
    defaultValues: { quantity: "", price: "", expiration: "", barcode: "", qrc: "" },
  })

  useEffect(() => {
    ;(async () => {
      const result = await get(
        { activeRoleId: "", _id: id },
        { _id: 1, quantity: 1, price: 1, hasAbsolutePrice: 1, pricePercentage: 1, expiration: 1, barcode: 1, qrc: 1 },
      )
      if (result.success && result.body?.[0]) {
        const s = result.body[0]
        form.reset({
          quantity: String(s.quantity ?? ""),
          price: String(s.price ?? ""),
          expiration: s.expiration ? new Date(s.expiration).toISOString().split("T")[0] : "",
          barcode: String(s.barcode ?? ""),
          qrc: String(s.qrc ?? ""),
        })
      } else {
        setNotFound(true)
      }
      setLoading(false)
    })()
  }, [id, form])

  const onSubmit = async (data: StuffData) => {
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        activeRoleId: getActiveRoleIdFromStore(),
        _id: id,
        quantity: Number(data.quantity) || 0,
        price: Number(data.price) || 0,
        isBarcodeSet: !!data.barcode,
        isQrcSet: !!data.qrc,
      }
      if (data.expiration) payload.expiration = new Date(data.expiration).toISOString()
      if (data.barcode) payload.barcode = Number(data.barcode)
      if (data.qrc) payload.qrc = data.qrc

      const result = await update(payload as any, { _id: 1, quantity: 1 })
      if (result.success) {
        toast.success("کالا با موفقیت به‌روزرسانی شد")
        router.push("/storehead/stuff")
      } else {
        toast.error(result.body?.message || "خطا در به‌روزرسانی کالا")
      }
    } catch {
      toast.error("خطا در به‌روزرسانی کالا")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: id })
      if (result.success) {
        toast.success("کالا با موفقیت حذف شد")
        router.push("/storehead/stuff")
      } else {
        toast.error(result.body?.message || "خطا در حذف کالا")
      }
    } catch {
      toast.error("خطا در حذف کالا")
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <ErrorState title="کالا یافت نشد" message="کالای مورد نظر وجود ندارد." />
        <div className="flex justify-center mt-4">
          <Button variant="ghost" size="sm" className="text-frost-link" onClick={() => router.push("/storehead/stuff")}>
            <ArrowRight className="size-4 ms-1" />
            بازگشت به لیست کالاها
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.push("/storehead/stuff")} className="rounded-lg">
            <ArrowRight className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-glacier">ویرایش کالا</h1>
            <p className="text-sm text-fog mt-1">به‌روزرسانی اطلاعات کالا</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => setShowDelete(true)}>
          <Trash2 className="size-4" /> حذف
        </Button>
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

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قیمت (ریال)<span className="text-destructive ms-1">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="۲۸۰۰۰۰۰" dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="bg-steel-border/20" />

              <FormField
                control={form.control}
                name="expiration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ انقضا</FormLabel>
                    <FormControl>
                      <Input type="date" dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1 gap-2">
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {submitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/storehead/stuff")} disabled={submitting}>
                  انصراف
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="حذف کالا"
        description="آیا از حذف این کالا اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmLabel={deleting ? "در حال حذف..." : "حذف"}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
