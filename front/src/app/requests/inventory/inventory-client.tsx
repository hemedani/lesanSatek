"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Warehouse, ArrowRight, ScrollText } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form/form-input"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import { cn } from "@/lib/utils"
import { add as addConsumption } from "@/app/actions/consumption/add"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface InventoryItem {
  _id: string
  quantity?: number
  minQuantity?: number
  maxQuantity?: number
  batchNo?: string
  location?: string
  createdAt?: string
  unit?: { _id: string; name?: string }
  warehouseUnit?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
  ware?: { _id: string; name?: string }
}

interface InventoryClientProps {
  items: InventoryItem[]
  prevUrl: string
  nextUrl: string
  page: number
}

const consumptionSchema = z.object({
  quantity: z.string().min(1, "مقدار الزامی است"),
  reason: z.string().optional(),
  consumedFor: z.string().optional(),
  notes: z.string().optional(),
  consumedAt: z.string().min(1, "تاریخ الزامی است"),
  consumedAtTime: z.string().optional(),
})

type ConsumptionData = z.infer<typeof consumptionSchema>

const columns: Column<InventoryItem>[] = [
  {
    key: "ware",
    label: "کالا",
    render: (item) => (
      <Link href={`/requests/inventory/${item._id}`} className="flex items-center gap-3 group">
        <div className="size-8 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
          <Warehouse className="size-4 text-electric-iris" />
        </div>
        <span className="text-moonlight font-medium group-hover:text-frost-link transition-colors">{item.ware?.name || item.wareModel?.name || "—"}</span>
      </Link>
    ),
  },
  {
    key: "quantity",
    label: "موجودی",
    render: (item) => (
      <span className="font-mono text-sm" dir="ltr">
        {item.quantity != null ? (
          <span className={cn(
            item.minQuantity != null && item.quantity < item.minQuantity
              ? "text-destructive font-medium"
              : "text-moonlight"
          )}>
            {item.quantity.toLocaleString("fa-IR")}
          </span>
        ) : "—"}
      </span>
    ),
  },
  {
    key: "batchNo",
    label: "شماره سریال",
    render: (item) => (
      <span className="text-fog text-sm font-mono" dir="ltr">{item.batchNo || "—"}</span>
    ),
    hideOnCard: true,
  },
  {
    key: "location",
    label: "موقعیت",
    render: (item) => (
      <span className="text-fog text-sm">{item.location || "—"}</span>
    ),
    hideOnCard: true,
  },
]

function InventoryClient({ items, prevUrl, nextUrl, page }: InventoryClientProps) {
  const router = useRouter()
  const [consumingItem, setConsumingItem] = useState<InventoryItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ConsumptionData>({
    resolver: zodV4Resolver(consumptionSchema),
    defaultValues: { quantity: "", reason: "", consumedFor: "", notes: "", consumedAt: new Date().toISOString(), consumedAtTime: new Date().toTimeString().slice(0, 5) },
  })

  async function handleConsume(data: ConsumptionData) {
    if (!consumingItem) return
    setSubmitting(true)
    try {
      const [h, m] = (data.consumedAtTime || "00:00").split(":").map(Number)
      const consumedDate = new Date(data.consumedAt)
      consumedDate.setHours(h || 0, m || 0)
      const result = await addConsumption(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          wareId: consumingItem.ware?._id || "",
          quantity: Number(data.quantity),
          reason: data.reason || undefined,
          consumedFor: data.consumedFor || undefined,
          notes: data.notes || undefined,
          consumedAt: consumedDate,
        },
        { _id: 1 },
      )
      if (result.success) {
        toast.success("مصرف با موفقیت ثبت شد")
        setConsumingItem(null)
        form.reset()
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در ثبت مصرف")
      }
    } catch {
      toast.error("خطا در ثبت مصرف")
    } finally {
      setSubmitting(false)
    }
  }

  function openConsumption(item: InventoryItem, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!item.ware?._id) {
      toast.error("این کالا قابلیت مصرف ندارد")
      return
    }
    form.reset()
    setConsumingItem(item)
  }

  return (
    <div className="space-y-6">
      <Link
        href="/requests"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>

      <PageHeader
        title="انبار واحد"
        description="موجودی کالاهای واحد شما"
      />

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={true}
        renderCard={(item) => (
          <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 relative">
            <Link href={`/requests/inventory/${item._id}`} className="block">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                  <Warehouse className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.ware?.name || item.wareModel?.name || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.quantity != null && (
                      <span className={cn(
                        "text-sm font-mono",
                        item.minQuantity != null && item.quantity < item.minQuantity
                          ? "text-destructive"
                          : "text-fog"
                      )} dir="ltr">
                        {item.quantity.toLocaleString("fa-IR")} عدد
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {(item.batchNo || item.location) && (
                <div className="flex items-center gap-3 mt-2 text-xs text-fog/40">
                  {item.batchNo && <span dir="ltr">{item.batchNo}</span>}
                  {item.location && <span>{item.location}</span>}
                </div>
              )}
            </Link>
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-fog hover:text-amber-400 hover:bg-amber-500/10"
                onClick={(e) => openConsumption(item, e)}
              >
                <ScrollText className="size-3.5" />
                مصرف
              </Button>
            </div>
          </div>
        )}
        emptyTitle="موجودی‌ای یافت نشد"
        emptyDescription="هنوز هیچ کالایی در انبار واحد شما ثبت نشده است."
      />

      <Pagination prevUrl={prevUrl} nextUrl={nextUrl} page={page} />

      <Dialog open={!!consumingItem} onOpenChange={(open) => { if (!open) { setConsumingItem(null); form.reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ثبت مصرف</DialogTitle>
            <DialogDescription>
              ثبت مصرف {consumingItem?.ware?.name || consumingItem?.wareModel?.name || ""}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleConsume)} className="space-y-4">
              <FormInput control={form.control} name="quantity" label="مقدار مصرف" placeholder="مقدار را وارد کنید..." type="number" required disabled={submitting} />

              <div className="grid grid-cols-2 gap-3">
                <FormJalaliDatePicker control={form.control} name="consumedAt" label="تاریخ مصرف" required disabled={submitting} />
                <FormInput control={form.control} name="consumedAtTime" label="ساعت" type="time" disabled={submitting} />
              </div>
              <FormInput control={form.control} name="consumedFor" label="مصرف‌شونده" placeholder="نام شخص..." disabled={submitting} />

              <FormInput control={form.control} name="reason" label="دلیل مصرف" placeholder="دلیل مصرف را وارد کنید..." disabled={submitting} />
              <FormInput control={form.control} name="notes" label="توضیحات" placeholder="توضیحات (اختیاری)" disabled={submitting} />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => { setConsumingItem(null); form.reset(); }} disabled={submitting}>انصراف</Button>
                <Button type="submit" disabled={submitting}>{submitting ? "در حال ثبت..." : "ثبت مصرف"}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { InventoryClient }
