"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  ScrollText,
  Hash,
  Tag,
  Package,
  User,
  Building2,
  CalendarDays,
  RefreshCw,
  ClipboardList,
  Zap,
  Trash2,
  FolderTree,
  Activity,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { remove as removeConsumption } from "@/app/actions/consumption/remove"

export interface ConsumptionRecord {
  _id: string
  quantity?: number
  notes?: string
  reason?: string
  consumedFor?: string
  consumedAt?: string
  createdAt?: string
  updatedAt?: string
  unit?: { _id: string; name?: string; type?: string }
  consumedBy?: { _id: string; first_name?: string; last_name?: string }
  inventory?: { _id: string; quantity?: number }
  ware?: { _id: string; name?: string; enName?: string; brand?: string }
  wareModel?: { _id: string; name?: string; enName?: string }
  wareGroup?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
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

function ConsumptionDetailClient({ item }: { item: ConsumptionRecord }) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const wareName = item.ware?.name || item.wareModel?.name || "کالای بدون نام"
  const consumedByName = item.consumedBy
    ? [item.consumedBy.first_name, item.consumedBy.last_name].filter(Boolean).join(" ")
    : ""
  const hierarchyChips = [item.wareType?.name, item.wareClass?.name, item.wareGroup?.name].filter(Boolean) as string[]
  const unitTypeLabel = item.unit?.type ? unitTypeLabels[item.unit.type] || item.unit.type : ""

  async function handleDelete() {
    setSubmitting(true)
    try {
      const res = await removeConsumption({ _id: item._id })
      if (res.success) {
        toast.success("مصرف با موفقیت حذف شد")
        setDeleteOpen(false)
        router.push("/unit-head/consumption")
      } else {
        toast.error(res.body?.message || "خطا در حذف مصرف")
      }
    } catch {
      toast.error("خطا در حذف مصرف")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Back link ─────────────────────────────────────────────── */}
      <Link
        href="/unit-head/consumption"
        className="inline-flex items-center gap-1.5 rounded-sm text-body-sm text-fog transition-colors hover:text-glacier focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowRight className="size-4" />
        بازگشت به مصرف کالا
      </Link>

      {/* ── 1. Hero header ────────────────────────────────────────── */}
      <Card variant="glass" className="glass-card-conic-top [--card-spacing:--spacing(6)]">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-inset ring-amber-500/20 shadow-[0_0_28px_-8px_rgba(245,158,11,0.45)]">
                <ScrollText className="size-7 text-amber-400" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h1 className="text-heading-sm font-semibold leading-8 text-glacier">{wareName}</h1>
                <p className="mt-1.5 text-body-sm text-fog">
                  {[item.wareModel?.name, item.ware?.brand].filter(Boolean).join(" · ") || "بدون توضیح"}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {item.inventory?._id && (
                <Link href={`/unit-head/inventory/${item.inventory._id}`}>
                  <Button variant="ghost" className="w-full gap-2 px-4 sm:w-auto">
                    <Package className="size-5" />
                    وضعیت موجودی
                  </Button>
                </Link>
              )}
              <Button variant="ghost" className="w-full gap-2 px-4 text-ember hover:text-ember hover:bg-ember/5 sm:w-auto" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-5" />
                حذف مصرف
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06] lg:grid-cols-4">
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">مقدار مصرف</p>
              <p className="mt-1.5 text-2xl font-bold tabular-nums text-amber-400 leading-8" dir="ltr">
                {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
              </p>
            </div>
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">واحد مصرف‌کننده</p>
              <p className="mt-1.5 truncate text-body font-semibold text-moonlight leading-8">{item.unit?.name || "—"}</p>
            </div>
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">مصرف‌شونده</p>
              <p className="mt-1.5 truncate text-body font-semibold text-moonlight leading-8">{item.consumedFor || "—"}</p>
            </div>
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">تاریخ مصرف</p>
              <p className="mt-1.5 text-body font-semibold text-moonlight leading-8">{faDate(item.consumedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Main content (two-column) ──────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard icon={Tag} title="هویت کالا" iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
              <MetaItem icon={Package} label="نام کالا" value={item.ware?.name || item.wareModel?.name || "—"} />
              <MetaItem icon={ClipboardList} label="مدل کالا" value={item.wareModel?.name || "—"} />
              <MetaItem icon={Hash} label="برند" value={item.ware?.brand || "—"} />
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

          <SectionCard icon={ScrollText} title="جزئیات مصرف" iconClassName="bg-amber-500/10 text-amber-400 ring-amber-500/15">
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
              <MetaItem
                icon={Hash}
                label="مقدار مصرف"
                value={item.quantity != null ? `${item.quantity.toLocaleString("fa-IR")} عدد` : "—"}
                valueDir="ltr"
                valueClassName="text-amber-400"
              />
              <MetaItem icon={User} label="مصرف‌شونده" value={item.consumedFor || "—"} />
              {item.reason && <MetaItem icon={FolderTree} label="دلیل مصرف" value={item.reason} />}
              {item.notes && (
                <div className="col-span-full border-t border-steel-border/15 pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] ring-1 ring-inset ring-steel-border/20">
                      <ClipboardList className="size-5 text-frost-link/80" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-caption text-fog">توضیحات</p>
                      <p className="mt-0.5 text-body-sm font-medium leading-6 text-moonlight">{item.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard icon={Zap} title="اقدامات" iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15">
            <div className="space-y-3">
              {item.inventory?._id && (
                <Link href={`/unit-head/inventory/${item.inventory._id}`} className="block w-full">
                  <Button variant="ghost" className="w-full gap-2">
                    <Package className="size-5" />
                    مشاهده وضعیت موجودی
                  </Button>
                </Link>
              )}
              <Link href="/unit-head/stock-movements" className="block w-full">
                <Button variant="ghost" className="w-full gap-2">
                  <Activity className="size-5" />
                  گردش کالا
                </Button>
              </Link>
              <Button variant="ghost" className="w-full gap-2 text-ember hover:text-ember hover:bg-ember/5" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-5" />
                حذف مصرف
              </Button>
            </div>
          </SectionCard>

          <SectionCard icon={Building2} title="واحد و ثبت‌کننده" iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15">
            <div className="space-y-4">
              <MetaItem icon={Building2} label="واحد مصرف‌کننده" value={unitTypeLabel ? `${item.unit?.name || "—"} (${unitTypeLabel})` : item.unit?.name || "—"} />
              {item.consumedBy && <MetaItem icon={User} label="ثبت‌کننده" value={consumedByName || "—"} />}
              <MetaItem icon={CalendarDays} label="تاریخ مصرف" value={faDate(item.consumedAt)} />
              <MetaItem icon={CalendarDays} label="تاریخ ثبت" value={faDate(item.createdAt, true)} />
              <MetaItem icon={RefreshCw} label="آخرین بروزرسانی" value={faDate(item.updatedAt, true)} />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── 3. Delete modal ───────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={(open) => { if (!open) setDeleteOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف مصرف</DialogTitle>
            <DialogDescription>
              رکورد مصرف «{wareName}» با مقدار {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "۰"} عدد به صورت
              دائمی حذف می‌شود. این عملیات قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)} disabled={submitting}>
              انصراف
            </Button>
            <Button type="button" variant="destructive" className="gap-2" onClick={handleDelete} disabled={submitting}>
              <Trash2 className="size-5" />
              {submitting ? "در حال حذف..." : "حذف مصرف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ConsumptionDetailClient }