"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  ArrowLeft,
  Box,
  AlertTriangle,
  SlidersHorizontal,
  ArrowLeftRight,
  Activity,
  ScrollText,
  Hash,
  MapPin,
  Barcode,
  CalendarDays,
  RefreshCw,
  Building2,
  Warehouse,
  Package,
  Tag,
  ClipboardList,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodV4Resolver } from "@/lib/zod-v4-resolver"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form/form-input"
import { FormTextarea } from "@/components/form/form-textarea"
import { FormSearchSelect } from "@/components/form/form-search-select"
import { adjust as adjustInventory } from "@/app/actions/inventory/adjust"
import { transfer as transferInventory } from "@/app/actions/inventory/transfer"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface InventoryItem {
  _id: string
  quantity?: number
  minQuantity?: number
  maxQuantity?: number
  batchNo?: string
  expirationDate?: string
  location?: string
  lastCountedAt?: string
  createdAt?: string
  updatedAt?: string
  unit?: { _id: string; name?: string; type?: string }
  warehouseUnit?: { _id: string; name?: string; type?: string }
  ware?: { _id: string; name?: string; enName?: string; brand?: string; irc?: string; gtin?: number }
  wareModel?: { _id: string; name?: string; enName?: string }
  wareGroup?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
}

export interface StockMovementInline {
  _id: string
  quantity?: number
  reason?: string
  description?: string
  createdAt?: string
  unit?: { _id: string; name?: string }
  createdBy?: { _id: string; first_name?: string; last_name?: string }
}

const reasonLabels: Record<string, string> = {
  goods_receipt: "رسید کالا",
  goods_issue: "خروج کالا",
  transfer_in: "ورود انتقالی",
  transfer_out: "خروج انتقالی",
  consumption: "مصرف",
  adjustment: "تعدیل",
  return: "برگشت",
  write_off: "حذف",
}

const reasonStyle: Record<string, string> = {
  goods_receipt: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  goods_issue: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  transfer_in: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  transfer_out: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  consumption: "bg-red-500/10 text-red-400 border-red-500/20",
  adjustment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  return: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  write_off: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
}

const unitTypeLabels: Record<string, string> = {
  General: "عمومی",
  Warehouse: "انبار",
  Logistics: "لجستیک",
  Production: "تولید",
  Administration: "اداری",
  Finance: "مالی",
  Expert: "کارشناسی",
}

function faDate(iso?: string, withTime = false): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

function SectionCard({
  icon: Icon,
  iconClassName,
  title,
  badge,
  children,
  className,
}: {
  icon: LucideIcon
  iconClassName?: string
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card variant="glass" className={cn("[--card-spacing:--spacing(6)]", className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                iconClassName || "bg-white/[0.03] text-fog ring-steel-border/20",
              )}
            >
              <Icon className="size-5" />
            </div>
            <CardTitle className="text-subheading font-medium text-moonlight">{title}</CardTitle>
          </div>
          {badge}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
  valueDir,
  valueClassName,
}: {
  icon: LucideIcon
  label: string
  value: React.ReactNode
  valueDir?: "ltr"
  valueClassName?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] ring-1 ring-inset ring-steel-border/20">
        <Icon className="size-5 text-frost-link/80" />
      </div>
      <div className="min-w-0">
        <p className="text-caption text-fog">{label}</p>
        <p className={cn("mt-0.5 truncate text-body-sm font-medium text-moonlight", valueClassName)} dir={valueDir}>
          {value}
        </p>
      </div>
    </div>
  )
}

const adjustSchema = z.object({
  quantity: z.string().min(1, "مقدار الزامی است"),
  description: z.string().optional(),
})
type AdjustData = z.infer<typeof adjustSchema>

const transferSchema = z.object({
  toUnitId: z.string().min(1, "واحد مقصد الزامی است"),
  quantity: z.string().min(1, "مقدار الزامی است"),
  description: z.string().optional(),
})
type TransferData = z.infer<typeof transferSchema>

function InventoryDetailClient({ item, movements }: { item: InventoryItem; movements: StockMovementInline[] }) {
  const router = useRouter()

  const lowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity
  const wareName = item.ware?.name || item.wareModel?.name || "کالای بدون نام"

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const adjustForm = useForm<AdjustData>({
    resolver: zodV4Resolver(adjustSchema),
    defaultValues: { quantity: item.quantity != null ? String(item.quantity) : "", description: "" },
  })

  const transferForm = useForm<TransferData>({
    resolver: zodV4Resolver(transferSchema),
    defaultValues: { toUnitId: "", quantity: "", description: "" },
  })

  const fetchUnits = useCallback(
    async (search?: string) => {
      const res = await getUnits(
        { page: 1, limit: 50, ...(search ? { search } : {}) },
        { _id: 1, name: 1, type: 1 },
      )
      if (!res.success) return []
      return ((res.body as { _id: string; name?: string; type?: string }[]) || [])
        .filter((u) => u._id !== item.unit?._id)
        .map((u) => ({
          _id: u._id,
          name: u.name || "بدون نام",
          sublabel: unitTypeLabels[u.type || ""] || u.type,
        }))
    },
    [item.unit?._id],
  )

  async function handleAdjust(data: AdjustData) {
    setSubmitting(true)
    try {
      const res = await adjustInventory(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          _id: item._id,
          quantity: Number(data.quantity),
          description: data.description || undefined,
        },
        { _id: 1 },
      )
      if (res.success) {
        toast.success("موجودی با موفقیت تعدیل شد")
        setAdjustOpen(false)
        adjustForm.reset()
        router.refresh()
      } else {
        toast.error(res.body?.message || "خطا در تعدیل موجودی")
      }
    } catch {
      toast.error("خطا در تعدیل موجودی")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTransfer(data: TransferData) {
    setSubmitting(true)
    try {
      const res = await transferInventory(
        {
          activeRoleId: getActiveRoleIdFromStore(),
          fromUnitId: item.unit?._id || "",
          toUnitId: data.toUnitId,
          wareId: item.ware?._id || "",
          quantity: Number(data.quantity),
          description: data.description || undefined,
        },
        { quantity: 1 },
      )
      if (res.success) {
        toast.success("انتقال با موفقیت انجام شد")
        setTransferOpen(false)
        transferForm.reset()
        router.refresh()
      } else {
        toast.error(res.body?.message || "خطا در انتقال موجودی")
      }
    } catch {
      toast.error("خطا در انتقال موجودی")
    } finally {
      setSubmitting(false)
    }
  }

  const hierarchyChips = [item.wareType?.name, item.wareClass?.name, item.wareGroup?.name].filter(Boolean) as string[]

  return (
    <div className="space-y-6">
      {/* ── Back link ─────────────────────────────────────────────── */}
      <Link
        href="/requests/inventory"
        className="inline-flex items-center gap-1.5 rounded-sm text-body-sm text-fog transition-colors hover:text-glacier focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowRight className="size-4" />
        بازگشت به موجودی انبار
      </Link>

      {/* ── 1. Hero header ────────────────────────────────────────── */}
      <Card variant="glass" className="glass-card-conic-top [--card-spacing:--spacing(6)]">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/[0.08] shadow-[0_0_28px_-8px_rgba(102,58,243,0.55)]",
                  lowStock ? "bg-ember/10 ring-ember/15" : "bg-electric-iris/10 ring-electric-iris/20",
                )}
              >
                <Box className={cn("size-7", lowStock ? "text-ember" : "text-electric-iris")} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-heading-sm font-semibold leading-8 text-glacier">{wareName}</h1>
                  {lowStock && (
                    <Badge
                      variant="outline"
                      className="rounded-full bg-ember/10 px-2.5 py-0.5 text-[11px] font-medium text-ember border-ember/20"
                    >
                      کم‌موجودی
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 text-body-sm text-fog">
                  {[item.wareModel?.name, item.ware?.brand].filter(Boolean).join(" · ") || "بدون توضیح"}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button className="gap-2 px-5" onClick={() => setAdjustOpen(true)}>
                <SlidersHorizontal className="size-5" />
                تعدیل موجودی
              </Button>
              <Button variant="ghost" className="gap-2 px-4" onClick={() => setTransferOpen(true)}>
                <ArrowLeftRight className="size-5" />
                انتقال
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">موجودی فعلی</p>
              <p
                className={cn(
                  "mt-1.5 text-2xl font-bold tabular-nums leading-8",
                  lowStock ? "text-ember" : "text-glacier",
                )}
                dir="ltr"
              >
                {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
              </p>
            </div>
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">حداقل</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-moonlight leading-8" dir="ltr">
                {item.minQuantity != null ? item.minQuantity.toLocaleString("fa-IR") : "—"}
              </p>
            </div>
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">حداکثر</p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-moonlight leading-8" dir="ltr">
                {item.maxQuantity != null ? item.maxQuantity.toLocaleString("fa-IR") : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {lowStock && (
        <div className="flex items-center gap-2.5 rounded-xl border border-ember/20 bg-ember/[0.06] px-4 py-3 text-body-sm text-ember">
          <AlertTriangle className="size-5 shrink-0" />
          موجودی این کالا کمتر از حداقل مقدار است؛ برای جلوگیری از اتمام کالا، درخواست خرید ثبت کنید.
        </div>
      )}

      {/* ── 2. Main content (two-column) ──────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard icon={Tag} title="هویت کالا" iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
              <MetaItem icon={Package} label="نام کالا" value={item.ware?.name || "—"} />
              <MetaItem icon={ClipboardList} label="مدل کالا" value={item.wareModel?.name || "—"} />
              <MetaItem icon={Hash} label="برند" value={item.ware?.brand || "—"} />
              {item.ware?.irc && <MetaItem icon={Barcode} label="IRC" value={item.ware.irc} valueDir="ltr" />}
              {item.ware?.gtin != null && <MetaItem icon={Barcode} label="GTIN" value={String(item.ware.gtin)} valueDir="ltr" />}
              {item.ware?.enName && <MetaItem icon={Tag} label="نام انگلیسی" value={item.ware.enName} valueDir="ltr" />}
            </div>
            {hierarchyChips.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-steel-border/15 pt-4">
                <span className="text-caption text-fog/60">دسته‌بندی:</span>
                {hierarchyChips.map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="rounded-full bg-frost-link/5 px-2.5 py-0.5 text-[11px] font-medium text-fog border-steel-border/30"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard icon={Hash} title="موجودی و نگهداری" iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
              <MetaItem
                icon={Package}
                label="موجودی فعلی"
                value={item.quantity != null ? `${item.quantity.toLocaleString("fa-IR")} عدد` : "—"}
                valueDir="ltr"
                valueClassName={cn(lowStock && "text-ember")}
              />
              <MetaItem
                icon={Hash}
                label="حداقل موجودی"
                value={item.minQuantity != null ? `${item.minQuantity.toLocaleString("fa-IR")} عدد` : "—"}
                valueDir="ltr"
              />
              <MetaItem
                icon={Hash}
                label="حداکثر موجودی"
                value={item.maxQuantity != null ? `${item.maxQuantity.toLocaleString("fa-IR")} عدد` : "—"}
                valueDir="ltr"
              />
              {item.batchNo && <MetaItem icon={Barcode} label="شماره سریال" value={item.batchNo} valueDir="ltr" />}
              {item.expirationDate && (
                <MetaItem icon={CalendarDays} label="تاریخ انقضا" value={faDate(item.expirationDate)} />
              )}
              {item.lastCountedAt && (
                <MetaItem icon={RefreshCw} label="آخرین شمارش" value={faDate(item.lastCountedAt, true)} />
              )}
            </div>
          </SectionCard>

          {movements.length > 0 && (
            <SectionCard
              icon={Activity}
              title="آخرین گردش کالا"
              iconClassName="bg-sky-500/10 text-sky-400 ring-sky-500/15"
              badge={
                <Link href="/requests/stock-movements" className="inline-flex items-center gap-1.5 text-body-sm text-fog transition-colors hover:text-frost-link">
                  مشاهده همه
                  <ArrowLeft className="size-4" />
                </Link>
              }
            >
              <div className="space-y-2">
                {movements.map((mv) => {
                  const isNeg = (mv.quantity || 0) < 0
                  return (
                    <Link
                      key={mv._id}
                      href={`/requests/stock-movements/${mv._id}`}
                      className="group/mv block rounded-xl border border-steel-border/20 bg-white/[0.02] p-3.5 transition-colors hover:border-frost-link/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-white/[0.06]",
                              isNeg ? "bg-red-500/10" : "bg-emerald-500/10",
                            )}
                          >
                            <Activity className={cn("size-5", isNeg ? "text-red-400" : "text-emerald-400")} />
                          </div>
                          <div className="min-w-0">
                            <Badge
                              variant="outline"
                              className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", reasonStyle[mv.reason || ""] || "bg-white/[0.04] text-fog border-white/[0.06]")}
                            >
                              {reasonLabels[mv.reason || ""] || mv.reason || "—"}
                            </Badge>
                            {mv.description && (
                              <p className="mt-1 truncate text-body-sm text-fog/70">{mv.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className={cn("text-body font-bold tabular-nums", isNeg ? "text-red-400" : "text-emerald-400")} dir="ltr">
                            {isNeg ? "" : "+"}{(mv.quantity || 0).toLocaleString("fa-IR")}
                          </span>
                          <span className="text-body-sm text-fog/60">{faDate(mv.createdAt)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard icon={Zap} title="اقدامات" iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15">
            <div className="space-y-3">
              <Button className="w-full gap-2" onClick={() => setAdjustOpen(true)}>
                <SlidersHorizontal className="size-5" />
                تعدیل موجودی
              </Button>
              <Button variant="ghost" className="w-full gap-2" onClick={() => setTransferOpen(true)}>
                <ArrowLeftRight className="size-5" />
                انتقال به واحد دیگر
              </Button>
              <Link href="/requests/stock-movements" className="block w-full">
                <Button variant="ghost" className="w-full gap-2">
                  <Activity className="size-5" />
                  گردش کالا
                </Button>
              </Link>
              <Link href="/requests/consumption" className="block w-full">
                <Button variant="ghost" className="w-full gap-2">
                  <ScrollText className="size-5" />
                  مصرف کالا
                </Button>
              </Link>
            </div>
          </SectionCard>

          <SectionCard icon={ClipboardList} title="خلاصه" iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15">
            <div className="space-y-4">
              <MetaItem icon={Building2} label="واحد مصرف‌کننده" value={item.unit?.name || "—"} />
              <MetaItem icon={Warehouse} label="انبار" value={item.warehouseUnit?.name || "—"} />
              {item.location && <MetaItem icon={MapPin} label="موقعیت" value={item.location} />}
              <MetaItem icon={CalendarDays} label="تاریخ ثبت" value={faDate(item.createdAt)} />
              <MetaItem icon={RefreshCw} label="آخرین بروزرسانی" value={faDate(item.updatedAt)} />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── 3. Adjust modal ───────────────────────────────────────── */}
      <Dialog open={adjustOpen} onOpenChange={(open) => { if (!open) { setAdjustOpen(false); adjustForm.reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعدیل موجودی</DialogTitle>
            <DialogDescription>
              تنظیم مقدار موجودی «{wareName}» — این تغییر در گردش کالا ثبت می‌شود.
            </DialogDescription>
          </DialogHeader>
          <Form {...adjustForm}>
            <form onSubmit={adjustForm.handleSubmit(handleAdjust)} className="space-y-4">
              <FormInput
                control={adjustForm.control}
                name="quantity"
                label="مقدار جدید موجودی"
                placeholder="مقدار را وارد کنید..."
                type="number"
                required
                disabled={submitting}
              />
              <FormTextarea
                control={adjustForm.control}
                name="description"
                label="توضیحات"
                placeholder="دلیل تعدیل (اختیاری)"
                disabled={submitting}
                rows={3}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setAdjustOpen(false); adjustForm.reset(); }} disabled={submitting}>
                  انصراف
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "در حال ثبت..." : "ثبت تعدیل"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── 4. Transfer modal ─────────────────────────────────────── */}
      <Dialog open={transferOpen} onOpenChange={(open) => { if (!open) { setTransferOpen(false); transferForm.reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>انتقال به واحد دیگر</DialogTitle>
            <DialogDescription>
              انتقال «{wareName}» از واحد «{item.unit?.name || "—"}» به واحد مقصد.
            </DialogDescription>
          </DialogHeader>
          <Form {...transferForm}>
            <form onSubmit={transferForm.handleSubmit(handleTransfer)} className="space-y-4">
              <FormSearchSelect
                control={transferForm.control}
                name="toUnitId"
                label="واحد مقصد"
                placeholder="انتخاب واحد مقصد..."
                fetcher={fetchUnits}
                required
                disabled={submitting}
              />
              <FormInput
                control={transferForm.control}
                name="quantity"
                label="مقدار انتقال"
                placeholder="مقدار را وارد کنید..."
                type="number"
                required
                disabled={submitting}
              />
              <FormTextarea
                control={transferForm.control}
                name="description"
                label="توضیحات"
                placeholder="توضیحات (اختیاری)"
                disabled={submitting}
                rows={3}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setTransferOpen(false); transferForm.reset(); }} disabled={submitting}>
                  انصراف
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "در حال انتقال..." : "انجام انتقال"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { InventoryDetailClient }
