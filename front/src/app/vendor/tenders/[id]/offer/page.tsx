"use client"

import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState, use } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { submit as submitOffer } from "@/app/actions/tenderOffer/submit"

const offerSchema = z.object({
  price: z.string().min(1, "قیمت پیشنهادی الزامی است"),
  deliveryTime: z.string().min(1, "زمان تحویل الزامی است"),
  terms: z.string().optional(),
  notes: z.string().optional(),
})

type OfferData = z.infer<typeof offerSchema>

export default function SubmitOfferPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: tenderId } = use(params)
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<OfferData>({
    resolver: zodV4Resolver(offerSchema),
    defaultValues: {
      price: "",
      deliveryTime: "",
      terms: "",
      notes: "",
    },
  })

  const onSubmit = async (data: OfferData) => {
    if (!tenderId) return
    setSubmitting(true)
    try {
      const result = await submitOffer(
        {
          tenderId,
          price: Number(data.price),
          deliveryTime: data.deliveryTime,
          terms: data.terms || "",
          notes: data.notes || "",
        },
        { _id: 1, status: 1 },
      )

      if (result.success) {
        toast.success("پیشنهاد شما با موفقیت ثبت شد")
        router.push("/vendor/my-offers")
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
                    <FormLabel>زمان تحویل</FormLabel>
                    <FormControl>
                      <Input placeholder="مثلاً: ۱۵ روز" dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شرایط</FormLabel>
                    <FormControl>
                      <Textarea placeholder="شرایط پیشنهاد (اختیاری)" rows={3} dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
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
                <Button type="submit" disabled={submitting} className="flex-1 gap-2">
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
