"use client"

import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Loader2, ArrowRight, FileText, Warehouse } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchSelect, type SearchSelectOption } from "@/components/form/form-search-select"
import { add as addPR } from "@/app/actions/purchasingRequest/add"
import { gets as getWareModels } from "@/app/actions/wareModel/gets"
import { gets as getInventories } from "@/app/actions/inventory/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

const prSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  description: z.string().optional(),
  quantity: z.string().min(1, "تعداد الزامی است"),
  wareModelId: z.string().min(1, "مدل کالا الزامی است"),
})

type PRData = z.infer<typeof prSchema>

export default function NewRequestPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const form = useForm<PRData>({
    resolver: zodV4Resolver(prSchema),
    defaultValues: {
      title: "",
      description: "",
      quantity: "1",
      wareModelId: "",
    },
  })

  const [wareStocks, setWareStocks] = useState<{ name: string; quantity: number }[] | null>(null)
  const [loadingStock, setLoadingStock] = useState(false)
  const selectedWareModelId = form.watch("wareModelId")
  const prevWareModelRef = useRef("")

  useEffect(() => {
    const wmId = selectedWareModelId
    if (!wmId || wmId === prevWareModelRef.current) return
    prevWareModelRef.current = wmId
    setLoadingStock(true)
    getInventories(
      { activeRoleId: getActiveRoleIdFromStore(), wareModelId: wmId, page: 1, limit: 50 },
      { _id: 1, quantity: 1, ware: { _id: 1, name: 1 } },
    ).then((res) => {
      if (res.success && res.body) {
        const stocks: { name: string; quantity: number }[] = []
        const seen = new Set<string>()
        for (const inv of res.body as { quantity?: number; ware?: { _id: string; name?: string } }[]) {
          const name = inv.ware?.name || "کالای عمومی"
          if (seen.has(name)) continue
          seen.add(name)
          stocks.push({ name, quantity: inv.quantity || 0 })
        }
        setWareStocks(stocks.length > 0 ? stocks : null)
      } else {
        setWareStocks(null)
      }
    }).catch(() => {
      setWareStocks(null)
    }).finally(() => {
      setLoadingStock(false)
    })
  }, [selectedWareModelId])

  const loadWareModels = async (query?: string): Promise<SearchSelectOption[]> => {
    const res = await getWareModels(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 20, search: query },
      { _id: 1, name: 1 },
    )
    return res.success ? (res.body || []).map((w: { _id?: string; name?: string }) => ({
      _id: w._id || "",
      name: w.name || "",
    })) : []
  }

  const handleCreate = async (data: PRData) => {
    setSaving(true)
    try {
      const result = await addPR(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          title: data.title,
          description: data.description || undefined,
          quantity: Number(data.quantity),
          wareModelId: data.wareModelId,
        },
        { _id: 1, title: 1, status: 1 },
      )

      if (result.success && result.body?._id) {
        toast.success("درخواست خرید با موفقیت ایجاد شد")
        router.push(`/requests/${result.body._id}`)
      } else {
        toast.error(result.body?.message || "خطا در ایجاد درخواست خرید")
      }
    } catch {
      toast.error("خطا در ایجاد درخواست")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/requests"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>

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
            <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
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
                      <SearchSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="جستجوی مدل کالا..."
                        fetcher={loadWareModels}
                        label="مدل کالا"
                      />
                    </FormControl>
                    {loadingStock && (
                      <p className="text-xs text-fog/50 mt-1 flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        در حال بررسی موجودی...
                      </p>
                    )}
                    {!loadingStock && wareStocks !== null && selectedWareModelId && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-fog/60 flex items-center gap-1">
                          <Warehouse className="size-3" />
                          موجودی انبار:
                        </p>
                        <div className="space-y-0.5">
                          {wareStocks.map((ws) => (
                            <div key={ws.name} className="flex items-center justify-between text-xs px-2 py-0.5 rounded-sm bg-white/[0.03]">
                              <span className="text-fog">{ws.name}</span>
                              <span className={cn("font-mono", ws.quantity > 0 ? "text-emerald-400" : "text-fog/40")} dir="ltr">
                                {ws.quantity.toLocaleString("fa-IR")} عدد
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!loadingStock && wareStocks === null && selectedWareModelId && (
                      <p className="text-xs text-ember flex items-center gap-1 mt-1">
                        <Warehouse className="size-3" />
                        موجودی در انبار موجود نیست
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" disabled={saving} className="flex-1 gap-2" onClick={form.handleSubmit(handleCreate)}>
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  <FileText className="size-4" />
                  ایجاد درخواست
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
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
