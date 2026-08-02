"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, FileText, Loader2, Package, Send, Warehouse, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { SearchFieldSelect, type SearchFieldSelectOption } from "@/components/ui/search-field-select"
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

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  children,
  className,
}: {
  icon: React.ElementType
  iconClassName?: string
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card variant="glass" className={cn("[--card-spacing:--spacing(6)]", className)}>
      <CardHeader className="pb-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
              iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20"
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function RequiredMark() {
  return <span className="text-ember">*</span>
}

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

  const [selectedWareModelName, setSelectedWareModelName] = useState("")
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
    )
      .then((res) => {
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
      })
      .catch(() => {
        setWareStocks(null)
      })
      .finally(() => {
        setLoadingStock(false)
      })
  }, [selectedWareModelId])

  const loadWareModels = async (query?: string): Promise<SearchFieldSelectOption[]> => {
    const res = await getWareModels(
      { activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 20, search: query },
      { _id: 1, name: 1 },
    )
    return res.success
      ? (res.body || []).map((w: { _id?: string; name?: string }) => ({
          _id: w._id || "",
          name: w.name || "",
        }))
      : []
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
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="ثبت درخواست خرید جدید"
        description="اطلاعات درخواست خرید را وارد کنید؛ پس از ثبت، درخواست برای طی مراحل تأیید ارسال می‌شود."
      >
        <Link href="/requests">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            بازگشت به درخواست‌ها
          </Button>
        </Link>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-6">
          <SectionCard
            icon={FileText}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="مشخصات درخواست"
          >
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      عنوان <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثلاً: خرید لپ‌تاپ برای واحد فناوری"
                        dir="rtl"
                        className="h-11"
                        {...field}
                      />
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
                      <Textarea
                        placeholder="توضیحات تکمیلی (اختیاری)"
                        rows={3}
                        dir="rtl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={Package}
            iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15"
            title="کالای درخواستی"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[10rem_1fr]">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        تعداد <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="۱"
                          dir="rtl"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wareModelId"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        مدل کالا <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <SearchFieldSelect
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="جستجو و انتخاب مدل کالا…"
                          icon={Package}
                          fetcher={loadWareModels}
                          ariaLabel="مدل کالا"
                          hasError={!!fieldState.error}
                          onSelectData={(option) => setSelectedWareModelName(option.name)}
                          displayLabel={selectedWareModelName}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {loadingStock && selectedWareModelId && (
                <div className="flex items-center gap-2 rounded-lg border border-steel-border/15 bg-midnight-ink/40 px-3 py-2.5 text-caption text-fog">
                  <Loader2 className="size-4 shrink-0 animate-spin text-frost-link" />
                  در حال بررسی موجودی انبار…
                </div>
              )}

              {!loadingStock && selectedWareModelId && wareStocks !== null && wareStocks.length > 0 && (
                <div className="space-y-2.5 rounded-lg border border-steel-border/15 bg-midnight-ink/40 p-3">
                  <p className="flex items-center gap-2 text-caption font-medium text-moonlight">
                    <Warehouse className="size-4 text-frost-link" />
                    موجودی انبار
                  </p>
                  <div className="space-y-1">
                    {wareStocks.map((ws) => (
                      <div
                        key={ws.name}
                        className="flex items-center justify-between gap-3 rounded-md bg-white/[0.03] px-2.5 py-1.5"
                      >
                        <span className="min-w-0 flex-1 truncate text-caption text-fog">{ws.name}</span>
                        <span
                          className={cn(
                            "shrink-0 font-mono text-caption",
                            ws.quantity > 0 ? "text-glacier" : "text-fog/40"
                          )}
                          dir="ltr"
                        >
                          {ws.quantity.toLocaleString("fa-IR")} عدد
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loadingStock && selectedWareModelId && wareStocks === null && (
                <div className="flex items-center gap-2 rounded-lg border border-ember/15 bg-ember/5 px-3 py-2.5 text-caption text-ember">
                  <Warehouse className="size-4 shrink-0" />
                  موجودی در انبار موجود نیست
                </div>
              )}
            </div>
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
                  disabled={saving}
                  className="flex-1 gap-2 px-5 sm:flex-none"
                >
                  {saving ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Send className="size-5" />
                  )}
                  ثبت درخواست
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={saving}
                  onClick={() => router.push("/requests")}
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
