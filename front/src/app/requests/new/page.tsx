"use client"

import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormSearchSelect } from "@/components/form/form-search-select"
import { submit as submitPR } from "@/app/actions/purchasingRequest/submit"
import { gets as getProcesses } from "@/app/actions/process/gets"
import { gets as getWareModels } from "@/app/actions/wareModel/gets"

const prSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  description: z.string().optional(),
  estimatedAmount: z.string().min(1, "مبلغ تخمینی الزامی است"),
  quantity: z.string().min(1, "تعداد الزامی است"),
  wareModelId: z.string().min(1, "مدل کالا الزامی است"),
  processId: z.string().min(1, "فرآیند الزامی است"),
})

type PRData = z.infer<typeof prSchema>

export default function NewRequestPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<PRData>({
    resolver: zodV4Resolver(prSchema),
    defaultValues: {
      title: "",
      description: "",
      estimatedAmount: "",
      quantity: "1",
      wareModelId: "",
      processId: "",
    },
  })

  const loadProcesses = async (query: string) => {
    const res = await getProcesses(
      { page: 1, limit: 20, search: query || undefined },
      { _id: 1, name: 1 },
    )
    return res.success ? (res.body || []).map((p: { _id?: string; name?: string }) => ({
      value: p._id || "",
      label: p.name || "",
    })) : []
  }

  const loadWareModels = async (query: string) => {
    const res = await getWareModels(
      { page: 1, limit: 20, search: query || undefined },
      { _id: 1, name: 1 },
    )
    return res.success ? (res.body || []).map((w: { _id?: string; name?: string }) => ({
      value: w._id || "",
      label: w.name || "",
    })) : []
  }

  const onSubmit = async (data: PRData) => {
    setSubmitting(true)
    try {
      const result = await submitPR(
        {
          title: data.title,
          description: data.description || "",
          estimatedAmount: Number(data.estimatedAmount),
          quantity: Number(data.quantity),
          wareModelId: data.wareModelId,
          processId: data.processId,
        },
        { _id: 1, title: 1, status: 1 },
      )

      if (result.success) {
        toast.success("درخواست خرید با موفقیت ثبت شد")
        router.push("/requests/my-requests")
      } else {
        toast.error(result.body?.message || "خطا در ثبت درخواست")
      }
    } catch {
      toast.error("خطا در ثبت درخواست")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-glacier">درخواست خرید جدید</h1>
        <p className="text-sm text-fog mt-1">اطلاعات درخواست خرید خود را وارد کنید</p>
      </div>

      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-frost-link leading-6">
            اطلاعات اولیه
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان</FormLabel>
                    <FormControl>
                      <Input placeholder="عنوان درخواست خرید" dir="rtl" {...field} />
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
                      <Textarea placeholder="توضیحات (اختیاری)" rows={3} dir="rtl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estimatedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مبلغ تخمینی (تومان)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="۱۰۰۰۰۰۰" dir="rtl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تعداد</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="۱" dir="rtl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="wareModelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مدل کالا</FormLabel>
                    <FormControl>
                      <FormSearchSelect
                        placeholder="جستجوی مدل کالا..."
                        value={field.value}
                        onChange={field.onChange}
                        loadOptions={loadWareModels}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="processId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>فرآیند</FormLabel>
                    <FormControl>
                      <FormSearchSelect
                        placeholder="انتخاب فرآیند..."
                        value={field.value}
                        onChange={field.onChange}
                        loadOptions={loadProcesses}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1 gap-2">
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  ثبت درخواست
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
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
