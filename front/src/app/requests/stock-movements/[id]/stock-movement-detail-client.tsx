"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Activity,
  ScrollText,
  Hash,
  Tag,
  Package,
  User,
  Building2,
  Store,
  CalendarDays,
  RefreshCw,
  ClipboardList,
  Zap,
  Trash2,
  FolderTree,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { remove as removeStockMovement } from "@/app/actions/stockMovement/remove"

export interface StockMovement {
  _id: string
  quantity?: number
  balanceBefore?: number
  balanceAfter?: number
  reason?: string
  description?: string
  referenceType?: string
  referenceId?: string
  createdAt?: string
  updatedAt?: string
  unit?: { _id: string; name?: string; type?: string }
  createdBy?: { _id: string; first_name?: string; last_name?: string }
  store?: { _id: string; name?: string }
  ware?: { _id: string; name?: string; enName?: string; brand?: string }
  wareModel?: { _id: string; name?: string; enName?: string }
  wareGroup?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
}

interface StockMovementDetailClientProps {
  item: StockMovement
  relatedInventoryId: string | null
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

function StockMovementDetailClient({ item, relatedInventoryId }: StockMovementDetailClientProps) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const qty = item.quantity ?? 0
  const isIn = qty > 0
  const isOut = qty < 0
  const DirectionIcon = isIn ? ArrowDownToLine : isOut ? ArrowUpFromLine : Activity
  const wareName = item.ware?.name || item.wareModel?.name || "کالای بدون نام"
  const createdByName = item.createdBy
    ? [item.createdBy.first_name, item.createdBy.last_name].filter(Boolean).join(" ")
    : ""
  const unitTypeLabel = item.unit?.type ? unitTypeLabels[item.unit.type] || item.unit.type : ""
  const hierarchyChips = [item.wareType?.name, item.wareClass?.name, item.wareGroup?.name].filter(Boolean) as string[]
  const hasBalance = item.balanceBefore != null && item.balanceAfter != null
  const consumptionRef = item.referenceType === "consumption" && item.referenceId ? String(item.referenceId) : null

  async function handleDelete() {
    setSubmitting(true)
    try {
      const res = await removeStockMovement({ _id: item._id })
      if (res.success) {
        toast.success("گردش با موفقیت حذف شد")
        setDeleteOpen(false)
        router.push("/requests/stock-movements")
      } else {
        toast.error(res.body?.message || "خطا در حذف گردش")
      }
    } catch {
      toast.error("خطا در حذف گردش")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Back link ─────────────────────────────────────────────── */}
      <Link
        href="/requests/stock-movements"
        className="inline-flex items-center gap-1.5 rounded-sm text-body-sm text-fog transition-colors hover:text-glacier focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowRight className="size-4" />
        بازگشت به گردش کالا
      </Link>

      {/* ── 1. Hero header ────────────────────────────────────────── */}
      <Card variant="glass" className="glass-card-conic-top [--card-spacing:--spacing(6)]">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div
                className={cn(
                  "flex size-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/[0.08]",
                  isIn
                    ? "bg-emerald-500/10 ring-emerald-500/20 shadow-[0_0_28px_-8px_rgba(52,211,153,0.45)]"
                    : isOut
                      ? "bg-ember/10 ring-ember/15 shadow-[0_0_28px_-8px_rgba(228,109,76,0.45)]"
                      : "bg-white/[0.04] ring-steel-border/20",
                )}
              >
                <DirectionIcon className={cn("size-7", isIn ? "text-emerald-400" : isOut ? "text-ember" : "text-fog")} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-heading-sm font-semibold leading-8 text-glacier">{wareName}</h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                      isIn ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : isOut ? "bg-ember/10 text-ember border-ember/20" : "bg-white/[0.04] text-fog border-white/[0.06]",
                    )}
                  >
                    {isIn ? "ورود" : isOut ? "خروج" : "بدون تغییر"}
                  </Badge>
                </div>
                <p className="mt-1.5 text-body-sm text-fog">
                  {[item.wareModel?.name, item.ware?.brand].filter(Boolean).join(" · ") || "بدون توضیح"}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {relatedInventoryId && (
                <Link href={`/requests/inventory/${relatedInventoryId}`}>
                  <Button variant="ghost" className="w-full gap-2 px-4 sm:w-auto">
                    <Package className="size-5" />
                    وضعیت موجودی
                  </Button>
                </Link>
              )}
              <Button variant="ghost" className="w-full gap-2 px-4 text-ember hover:text-ember hover:bg-ember/5 sm:w-auto" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-5" />
                حذف گردش
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06] lg:grid-cols-4">
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">تغییر</p>
              <p
                className={cn(
                  "mt-1.5 text-2xl font-bold tabular-nums leading-8",
                  isIn ? "text-emerald-400" : isOut ? "text-ember" : "text-fog",
                )}
                dir="ltr"
              >
                {isOut ? "−" : "+"}{Math.abs(qty).toLocaleString("fa-IR")}
              </p>
            </div>
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">نوع گردش</p>
              <p className="mt-1.5 truncate text-body font-semibold text-moonlight leading-8">
                {reasonLabels[item.reason || ""] || item.reason || "—"}
              </p>
            </div>
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">واحد</p>
              <p className="mt-1.5 truncate text-body font-semibold text-moonlight leading-8">{item.unit?.name || "—"}</p>
            </div>
            <div className="bg-[#05060f]/60 p-4 text-center">
              <p className="text-caption text-fog">تاریخ</p>
              <p className="mt-1.5 text-body font-semibold text-moonlight leading-8">{faDate(item.createdAt)}</p>
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

          <SectionCard
            icon={DirectionIcon}
            title="جهت و مقدار"
            iconClassName={cn(
              isIn
                ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/15"
                : isOut
                  ? "bg-ember/10 text-ember ring-ember/15"
                  : "bg-white/[0.03] text-fog ring-steel-border/20",
            )}
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
              <MetaItem
                icon={Hash}
                label="مقدار تغییر"
                value={`${isOut ? "−" : "+"}${Math.abs(qty).toLocaleString("fa-IR")} عدد`}
                valueDir="ltr"
                valueClassName={isIn ? "text-emerald-400" : isOut ? "text-ember" : undefined}
              />
              <MetaItem
                icon={FolderTree}
                label="علت گردش"
                value={
                  item.reason ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                        reasonStyle[item.reason] || "bg-white/[0.04] text-fog border-white/[0.06]",
                      )}
                    >
                      {reasonLabels[item.reason] || item.reason}
                    </Badge>
                  ) : (
                    "—"
                  )
                }
              />
              {item.store?.name && <MetaItem icon={Store} label="انبار" value={item.store.name} />}
              {hasBalance && (
                <>
                  <MetaItem
                    icon={Hash}
                    label="موجودی قبل"
                    value={item.balanceBefore?.toLocaleString("fa-IR")}
                    valueDir="ltr"
                  />
                  <MetaItem
                    icon={Hash}
                    label="موجودی بعد"
                    value={item.balanceAfter?.toLocaleString("fa-IR")}
                    valueDir="ltr"
                  />
                </>
              )}
            </div>
          </SectionCard>

          {item.description && (
            <SectionCard icon={ClipboardList} title="توضیحات" iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15">
              <p className="text-body-sm font-medium leading-6 text-moonlight">{item.description}</p>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard icon={Zap} title="اقدامات" iconClassName="bg-electric-iris/10 text-electric-iris ring-electric-iris/15">
            <div className="space-y-3">
              {relatedInventoryId && (
                <Link href={`/requests/inventory/${relatedInventoryId}`} className="block w-full">
                  <Button variant="ghost" className="w-full gap-2">
                    <Package className="size-5" />
                    مشاهده وضعیت موجودی
                  </Button>
                </Link>
              )}
              {consumptionRef && (
                <Link href={`/requests/consumption/${consumptionRef}`} className="block w-full">
                  <Button variant="ghost" className="w-full gap-2">
                    <ScrollText className="size-5" />
                    مصرف مرتبط
                  </Button>
                </Link>
              )}
              <Link href="/requests/stock-movements" className="block w-full">
                <Button variant="ghost" className="w-full gap-2">
                  <Activity className="size-5" />
                  گردش کالا
                </Button>
              </Link>
            </div>
          </SectionCard>

          <SectionCard icon={ClipboardList} title="خلاصه" iconClassName="bg-frost-link/10 text-frost-link ring-frost-link/15">
            <div className="space-y-4">
              <MetaItem icon={Building2} label="واحد" value={unitTypeLabel ? `${item.unit?.name || "—"} (${unitTypeLabel})` : item.unit?.name || "—"} />
              {item.store?.name && <MetaItem icon={Store} label="انبار" value={item.store.name} />}
              {item.createdBy && <MetaItem icon={User} label="ثبت‌کننده" value={createdByName || "—"} />}
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
            <DialogTitle>حذف گردش</DialogTitle>
            <DialogDescription>
              رکورد گردش «{wareName}» با تغییر {isOut ? "−" : "+"}{Math.abs(qty).toLocaleString("fa-IR")} عدد به صورت دائمی
              حذف می‌شود. این عملیات قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)} disabled={submitting}>
              انصراف
            </Button>
            <Button type="button" variant="destructive" className="gap-2" onClick={handleDelete} disabled={submitting}>
              <Trash2 className="size-5" />
              {submitting ? "در حال حذف..." : "حذف گردش"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { StockMovementDetailClient }
