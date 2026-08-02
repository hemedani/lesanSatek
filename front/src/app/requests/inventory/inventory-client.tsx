"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Box,
  AlertTriangle,
  Package,
  Boxes,
  ScrollText,
  Building2,
  Warehouse,
  MapPin,
  Barcode,
  CalendarDays,
  ArrowDownUp,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { StatCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form/form-input"
import { FormJalaliDatePicker } from "@/components/form/form-jalali-date-picker"
import { cn } from "@/lib/utils"
import { add as addConsumption } from "@/app/actions/consumption/add"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface InventoryItem {
  _id: string
  quantity?: number
  minQuantity?: number
  maxQuantity?: number
  batchNo?: string
  location?: string
  createdAt?: string
  unit?: { _id: string; name?: string }
  warehouseUnit?: { _id: string; name?: string }
  ware?: { _id: string; name?: string; brand?: string }
  wareModel?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
}

export interface InventoryCounts {
  total: number
  lowStock: number
  totalQuantity: number
}

interface InventoryClientProps {
  items: InventoryItem[]
  prevUrl: string
  nextUrl: string
  page: number
  search: string
  sort: string
  counts: InventoryCounts
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "quantity-desc", label: "بیشترین موجودی" },
  { value: "quantity-asc", label: "کمترین موجودی" },
]

const consumptionSchema = z.object({
  quantity: z.string().min(1, "مقدار الزامی است"),
  reason: z.string().optional(),
  consumedFor: z.string().optional(),
  notes: z.string().optional(),
  consumedAt: z.string().min(1, "تاریخ الزامی است"),
  consumedAtTime: z.string().optional(),
})

type ConsumptionData = z.infer<typeof consumptionSchema>

function InventoryCard({
  item,
  onConsume,
}: {
  item: InventoryItem
  onConsume: (item: InventoryItem, e: React.MouseEvent) => void
}) {
  const lowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity
  const wareName = item.ware?.name || item.wareModel?.name || "کالای بدون نام"

  return (
    <Link
      href={`/requests/inventory/${item._id}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/[0.08]",
                lowStock ? "bg-ember/10" : "bg-electric-iris/10",
              )}
            >
              <Box className={cn("size-5", lowStock ? "text-ember" : "text-electric-iris")} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                {wareName}
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {item.wareType?.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                    {item.wareType.name}
                  </span>
                )}
                {item.ware?.brand && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                    {item.ware.brand}
                  </span>
                )}
              </div>
            </div>
          </div>
          {lowStock && (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full bg-ember/10 px-2.5 py-0.5 text-[11px] font-medium text-ember border-ember/20"
            >
              کم‌موجودی
            </Badge>
          )}
        </div>

        <div
          className={cn(
            "grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]",
            lowStock && "bg-ember/10",
          )}
        >
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">موجودی</p>
            <p
              className={cn(
                "mt-1 text-lg font-bold tabular-nums leading-7",
                lowStock ? "text-ember" : "text-glacier",
              )}
              dir="ltr"
            >
              {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
            </p>
          </div>
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">حداقل</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-fog leading-7" dir="ltr">
              {item.minQuantity != null ? item.minQuantity.toLocaleString("fa-IR") : "—"}
            </p>
          </div>
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">حداکثر</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-fog leading-7" dir="ltr">
              {item.maxQuantity != null ? item.maxQuantity.toLocaleString("fa-IR") : "—"}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
          {item.unit?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4 text-fog/60" />
              {item.unit.name}
            </span>
          )}
          {item.warehouseUnit?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Warehouse className="size-4 text-fog/60" />
              {item.warehouseUnit.name}
            </span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-fog/60" />
              {item.location}
            </span>
          )}
          {item.batchNo && (
            <span className="inline-flex items-center gap-1.5 font-mono" dir="ltr">
              <Barcode className="size-4 text-fog/60" />
              {item.batchNo}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
          {item.createdAt ? (
            <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
              <CalendarDays className="size-4 text-fog/60" />
              {new Date(item.createdAt).toLocaleDateString("fa-IR")}
            </span>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="ghost"
            className="h-10 gap-2 rounded-sm px-4 text-body-sm text-fog hover:bg-amber-500/10 hover:text-amber-400"
            onClick={(e) => onConsume(item, e)}
          >
            <ScrollText className="size-5" />
            ثبت مصرف
          </Button>
        </div>
      </div>
    </Link>
  )
}

function InventoryClient({ items, prevUrl, nextUrl, page, search, sort, counts }: InventoryClientProps) {
  const router = useRouter()
  const [consumingItem, setConsumingItem] = useState<InventoryItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ConsumptionData>({
    resolver: zodV4Resolver(consumptionSchema),
    defaultValues: {
      quantity: "",
      reason: "",
      consumedFor: "",
      notes: "",
      consumedAt: new Date().toISOString(),
      consumedAtTime: new Date().toTimeString().slice(0, 5),
    },
  })

  const makeParams = useCallback(
    (next: { search?: string; sort?: string }) => {
      const params = new URLSearchParams()
      const nextSearch = (next.search ?? search).trim()
      const nextSort = next.sort ?? sort
      if (nextSearch) params.set("search", nextSearch)
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort)
      return params.toString()
    },
    [search, sort],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`/requests/inventory${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleReset = () => router.push("/requests/inventory")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc"))

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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
        <StatCard
          label="کل اقلام موجودی"
          value={counts.total}
          icon={Package}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
        />
        <StatCard
          label="کم‌موجودی"
          value={counts.lowStock}
          icon={AlertTriangle}
          iconColor="text-ember"
          iconBg="bg-ember/10"
          subtitle={counts.lowStock > 0 ? "نیازمند توجه" : undefined}
        />
        <StatCard
          label="مجموع موجودی"
          value={counts.totalQuantity}
          icon={Boxes}
          iconColor="text-glacier"
          iconBg="bg-frost-link/10"
        />
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجو در کالاها…"
          ariaLabel="جستجو در موجودی انبار"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش موجودی"
            value={sort}
            onValueChange={handleSort}
            options={sortOptions}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-11 gap-2 rounded-sm px-4 text-body-sm text-moonlight"
            >
              <RotateCcw className="size-5" strokeWidth={2} />
              پاک کردن فیلترها
            </Button>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <InventoryCard key={item._id} item={item} onConsume={openConsumption} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Boxes}
          title={hasFilters ? "کالایی یافت نشد" : "موجودی‌ای ثبت نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا مرتب‌سازی، کالای موردنظر را پیدا کنید."
              : "هنوز هیچ کالایی در انبار واحد شما ثبت نشده است."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/requests">
                <Button variant="ghost" className="gap-2 px-4">
                  بازگشت به همه درخواست‌ها
                </Button>
              </Link>
            )
          }
        />
      )}

      {(prevUrl || nextUrl) && (
        <Pagination
          prevUrl={prevUrl}
          nextUrl={nextUrl}
          page={page}
          className="pt-2 border-t border-steel-border/15"
        />
      )}

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
