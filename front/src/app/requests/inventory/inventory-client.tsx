"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Warehouse, ScrollText, Building2, Barcode, MapPin, CalendarDays, Factory, FolderTree, Box } from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  expirationDate?: string
  location?: string
  lastCountedAt?: string
  createdAt?: string
  unit?: { _id: string; name?: string; type?: string }
  warehouseUnit?: { _id: string; name?: string; type?: string }
  ware?: { _id: string; name?: string; enName?: string; brand?: string }
  wareModel?: { _id: string; name?: string; enName?: string }
  wareGroup?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
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
    render: (item) => {
      const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity
      return (
        <Link href={`/requests/inventory/${item._id}`} className="flex items-center gap-3 min-w-0 max-w-[280px] group">
          <div className={cn(
            "size-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
            isLowStock ? "bg-ember/10" : "bg-electric-iris/10",
          )}>
            <Warehouse className={cn("size-4", isLowStock ? "text-ember" : "text-electric-iris")} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-moonlight truncate leading-5 group-hover:text-frost-link transition-colors">
                {item.ware?.name || item.wareModel?.name || "—"}
              </span>
              {isLowStock && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 bg-ember/10 text-ember border-ember/20 shrink-0">
                  کم‌موجودی
                </Badge>
              )}
            </div>
            {item.ware?.brand && (
              <p className="text-[10px] text-fog/40 truncate leading-4">{item.ware.brand}</p>
            )}
          </div>
        </Link>
      )
    },
  },
  {
    key: "wareType",
    label: "دسته‌بندی",
    hideOnCard: true,
    render: (item) => (
      <div className="space-y-0.5">
        {item.wareType?.name && <p className="text-xs text-fog">{item.wareType.name}</p>}
        {item.wareClass?.name && <p className="text-[10px] text-fog/50">{item.wareClass.name}</p>}
        {!item.wareType?.name && !item.wareClass?.name && <span className="text-xs text-fog/40">—</span>}
      </div>
    ),
  },
  {
    key: "unit",
    label: "واحد",
    render: (item) => (
      <span className="text-xs text-fog">{item.unit?.name || "—"}</span>
    ),
  },
  {
    key: "quantity",
    label: "موجودی",
    render: (item) => {
      const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity
      return (
        <div>
          <span className={cn(
            "text-sm font-semibold font-mono",
            isLowStock ? "text-ember" : "text-moonlight",
          )} dir="ltr">
            {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
          </span>
          {item.minQuantity != null && (
            <p className="text-[10px] text-fog/40" dir="ltr">
              حداقل: {item.minQuantity.toLocaleString("fa-IR")}
            </p>
          )}
        </div>
      )
    },
  },
  {
    key: "batchNo",
    label: "سریال",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog font-mono" dir="ltr">{item.batchNo || "—"}</span>
    ),
  },
  {
    key: "location",
    label: "موقعیت",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog">{item.location || "—"}</span>
    ),
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
        renderCard={(item) => {
          const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity

          return (
            <Link href={`/requests/inventory/${item._id}`} className="block">
              <div className="glass-card glass-card-hover-active rounded-xl overflow-hidden transition-all duration-200">
                {/* Header with consumption action */}
                <div className={cn(
                  "flex items-center gap-3 p-4 border-b",
                  isLowStock ? "border-ember/10 bg-ember/[0.02]" : "border-white/[0.04]",
                )}>
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
                    isLowStock ? "bg-ember/10" : "bg-electric-iris/10",
                  )}>
                    <Box className={cn("size-5", isLowStock ? "text-ember" : "text-electric-iris")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-moonlight truncate leading-5">
                        {item.ware?.name || item.wareModel?.name || "—"}
                      </p>
                      {isLowStock && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-ember/10 text-ember border-ember/20 shrink-0">
                          کم‌موجودی
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.ware?.brand && (
                        <span className="text-[10px] text-fog/50 flex items-center gap-1">
                          <Factory className="size-3" />
                          {item.ware.brand}
                        </span>
                      )}
                      {item.wareModel?.name && (
                        <span className="text-[10px] text-fog/40">مدل: {item.wareModel.name}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-fog hover:text-amber-400 hover:bg-amber-500/10 shrink-0"
                    onClick={(e) => openConsumption(item, e)}
                  >
                    <ScrollText className="size-3.5" />
                    مصرف
                  </Button>
                </div>

                {/* Quantity row */}
                <div className={cn(
                  "grid grid-cols-3 gap-px bg-white/[0.04]",
                  isLowStock && "bg-ember/[0.04]",
                )}>
                  <div className={cn(
                    "p-3 text-center",
                    isLowStock ? "bg-ember/[0.02]" : "bg-[#05060f]/60",
                  )}>
                    <p className="text-[10px] text-fog/50">موجودی</p>
                    <p className={cn(
                      "text-lg font-bold font-mono leading-7",
                      isLowStock ? "text-ember" : "text-glacier",
                    )} dir="ltr">
                      {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
                    </p>
                  </div>
                  <div className={cn(
                    "p-3 text-center",
                    isLowStock ? "bg-ember/[0.02]" : "bg-[#05060f]/60",
                  )}>
                    <p className="text-[10px] text-fog/50">حداقل</p>
                    <p className="text-lg font-bold font-mono text-fog leading-7" dir="ltr">
                      {item.minQuantity != null ? item.minQuantity.toLocaleString("fa-IR") : "—"}
                    </p>
                  </div>
                  <div className={cn(
                    "p-3 text-center",
                    isLowStock ? "bg-ember/[0.02]" : "bg-[#05060f]/60",
                  )}>
                    <p className="text-[10px] text-fog/50">حداکثر</p>
                    <p className="text-lg font-bold font-mono text-fog leading-7" dir="ltr">
                      {item.maxQuantity != null ? item.maxQuantity.toLocaleString("fa-IR") : "—"}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-1">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">واحد مصرف‌کننده</p>
                        <p className="text-xs text-moonlight truncate">{item.unit?.name || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Warehouse className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">انبار</p>
                        <p className="text-xs text-moonlight truncate">{item.warehouseUnit?.name || "—"}</p>
                      </div>
                    </div>
                    {item.batchNo && (
                      <div className="flex items-center gap-2">
                        <Barcode className="size-3.5 text-fog/30 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-fog/40">سریال</p>
                          <p className="text-xs text-moonlight font-mono" dir="ltr">{item.batchNo}</p>
                        </div>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-fog/30 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-fog/40">موقعیت</p>
                          <p className="text-xs text-moonlight truncate">{item.location}</p>
                        </div>
                      </div>
                    )}
                    {item.expirationDate && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-3.5 text-fog/30 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-fog/40">تاریخ انقضا</p>
                          <p className="text-xs text-moonlight">{new Date(item.expirationDate).toLocaleDateString("fa-IR")}</p>
                        </div>
                      </div>
                    )}
                    {item.createdAt && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-3.5 text-fog/30 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-fog/40">تاریخ ثبت</p>
                          <p className="text-xs text-moonlight">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category badges */}
                  {(item.wareType?.name || item.wareClass?.name || item.wareGroup?.name) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-white/[0.04]">
                      <FolderTree className="size-3 text-fog/30" />
                      {item.wareType?.name && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                          {item.wareType.name}
                        </Badge>
                      )}
                      {item.wareClass?.name && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                          {item.wareClass.name}
                        </Badge>
                      )}
                      {item.wareGroup?.name && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                          {item.wareGroup.name}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        }}
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
