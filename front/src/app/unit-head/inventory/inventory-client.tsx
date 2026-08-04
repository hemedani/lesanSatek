"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Warehouse,
  ArrowRightLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  Package,
  Boxes,
  AlertTriangle,
  Barcode,
  MapPin,
  CalendarDays,
  Factory,
  FolderTree,
  Box,
  ArrowDownUp,
  RotateCcw,
  ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { transferWithAudit } from "@/app/actions/inventory/transferWithAudit"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface Inventory {
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

export interface InventoryCounts {
  total: number
  lowStock: number
  totalQuantity: number
}

interface InventoryClientProps {
  items: Inventory[]
  counts: InventoryCounts
  isWarehouseGrouped?: boolean
  userUnitId?: string
}

const unitFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getUnits({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 })
  if (!result.success) return []
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }))
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "quantity-desc", label: "بیشترین موجودی" },
  { value: "quantity-asc", label: "کمترین موجودی" },
]

type SortKey = "createdAt-desc" | "createdAt-asc" | "quantity-desc" | "quantity-asc"

function isSortKey(value: string): value is SortKey {
  return sortOptions.some((o) => o.value === value)
}

function matchesSearch(item: Inventory, q: string): boolean {
  if (!q) return true
  const haystack = [
    item.ware?.name,
    item.ware?.enName,
    item.ware?.brand,
    item.wareModel?.name,
    item.wareType?.name,
    item.wareClass?.name,
    item.wareGroup?.name,
    item.unit?.name,
    item.warehouseUnit?.name,
    item.batchNo,
    item.location,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(q.toLowerCase())
}

function InvCard({ item, userUnitId }: { item: Inventory; userUnitId?: string }) {
  const isOwn = userUnitId ? item.unit?._id === userUnitId : false
  const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity

  return (
    <Link
      href={`/unit-head/inventory/${item._id}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
        {/* Top section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
                isOwn
                  ? "bg-electric-iris/10 ring-electric-iris/15"
                  : isLowStock
                    ? "bg-ember/10 ring-ember/15"
                    : "bg-white/[0.03] ring-steel-border/15",
              )}
            >
              <Box className={cn("size-5", isOwn ? "text-electric-iris" : isLowStock ? "text-ember" : "text-fog")} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                {item.ware?.name || item.wareModel?.name || "—"}
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {item.ware?.brand && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                    <Factory className="size-3.5" />
                    {item.ware.brand}
                  </span>
                )}
                {item.wareModel?.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">مدل: {item.wareModel.name}</span>
                )}
              </div>
            </div>
          </div>
          {isLowStock && (
            <Badge variant="outline" className="shrink-0 rounded-full bg-ember/10 px-2.5 py-0.5 text-[11px] font-medium text-ember border-ember/20">
              کم‌موجودی
            </Badge>
          )}
        </div>

        {/* Quantity row */}
        <div
          className={cn(
            "grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]",
            isLowStock && "bg-ember/10",
          )}
        >
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">موجودی</p>
            <p className={cn("mt-1 text-lg font-bold tabular-nums leading-7", isLowStock ? "text-ember" : "text-glacier")} dir="ltr">
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

        {/* Bottom metadata section */}
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

        {/* Footer row */}
        <div className="flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
          <div className="flex flex-wrap items-center gap-3">
            {item.expirationDate && (
              <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
                <CalendarDays className="size-4 text-fog/60" />
                انقضا: {new Date(item.expirationDate).toLocaleDateString("fa-IR")}
              </span>
            )}
            {item.createdAt && (
              <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
                <CalendarDays className="size-4 text-fog/60" />
                {new Date(item.createdAt).toLocaleDateString("fa-IR")}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-body-sm text-frost-link opacity-0 transition-opacity group-hover:opacity-100">
            جزئیات
            <ArrowLeft className="size-4" />
          </span>
        </div>

        {/* Category badges */}
        {(item.wareType?.name || item.wareClass?.name || item.wareGroup?.name) && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-steel-border/15 pt-3">
            <FolderTree className="size-3.5 text-fog/40" />
            {item.wareType?.name && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                {item.wareType.name}
              </Badge>
            )}
            {item.wareClass?.name && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                {item.wareClass.name}
              </Badge>
            )}
            {item.wareGroup?.name && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-frost-link/5 text-fog border-white/[0.06]">
                {item.wareGroup.name}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

function InvRow({ item, userUnitId, onTransfer }: { item: Inventory; userUnitId?: string; onTransfer: (item: Inventory) => void }) {
  const isOwn = userUnitId ? item.unit?._id === userUnitId : false
  const qty = item.quantity ?? 0
  const isLow = item.minQuantity != null && qty < item.minQuantity

  return (
    <Link
      href={`/unit-head/inventory/${item._id}`}
      className="group flex items-center gap-4 px-5 py-3.5 border-b border-steel-border/10 last:border-b-0 transition-colors hover:bg-white/[0.02] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-electric-iris/40"
    >
      <div className={cn(
        "size-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset",
        isOwn
          ? "bg-electric-iris/10 ring-electric-iris/15"
          : "bg-white/[0.03] ring-steel-border/15",
      )}>
        {isOwn ? (
          <Warehouse className="size-4 text-electric-iris" />
        ) : (
          <Building2 className="size-4 text-fog/40" />
        )}
      </div>
      <div className="min-w-0 flex-[2]">
        <p className="text-sm font-medium text-moonlight truncate">
          {item.ware?.name || item.wareModel?.name || "—"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.ware?.brand && (
            <span className="text-[10px] text-fog/50">{item.ware.brand}</span>
          )}
          {item.unit?.name && (
            <span className={cn(
              "text-[10px]",
              isOwn ? "text-electric-iris/60" : "text-fog/50",
            )}>
              {item.unit.name}
            </span>
          )}
        </div>
      </div>

      {/* Quantity with min/max */}
      <div className="text-end shrink-0 min-w-[100px]">
        <p className={cn(
          "text-base font-semibold font-mono leading-tight",
          isLow ? "text-rose-400" : isOwn ? "text-emerald-400" : "text-moonlight",
        )}>
          {qty.toLocaleString("fa-IR")}
        </p>
        {(item.minQuantity != null || item.maxQuantity != null) && (
          <p className="text-[10px] text-fog/40 mt-px" dir="ltr">
            {item.minQuantity != null && `حداقل ${item.minQuantity.toLocaleString("fa-IR")}`}
            {item.minQuantity != null && item.maxQuantity != null && " · "}
            {item.maxQuantity != null && `حداکثر ${item.maxQuantity.toLocaleString("fa-IR")}`}
          </p>
        )}
      </div>

      {/* Extra info */}
      <div className="hidden md:block text-end shrink-0 min-w-[130px]">
        {item.warehouseUnit?.name && (
          <p className="text-xs text-fog/60 truncate">{item.warehouseUnit.name}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {item.batchNo && <span className="text-[10px] text-fog/40 font-mono" dir="ltr">{item.batchNo}</span>}
          {item.expirationDate && (
            <span className="text-[10px] text-fog/40">
              {new Date(item.expirationDate).toLocaleDateString("fa-IR")}
            </span>
          )}
        </div>
      </div>

      {/* Category badges - hidden on small */}
      {(item.wareType?.name || item.wareClass?.name) && (
        <div className="hidden lg:flex items-center gap-1 shrink-0 min-w-[100px]">
          {item.wareType?.name && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-white/[0.03] text-fog/50 border-white/[0.06]">
              {item.wareType.name}
            </Badge>
          )}
          {item.wareClass?.name && (
            <Badge variant="outline" className="text-[8px] px-1 py-0 bg-white/[0.03] text-fog/50 border-white/[0.06]">
              {item.wareClass.name}
            </Badge>
          )}
        </div>
      )}

      <Button
        variant="ghost"
        size="icon-xs"
        className="text-emerald-400/60 hover:text-emerald-400 shrink-0"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onTransfer(item)
        }}
        aria-label={`انتقال ${item.ware?.name || item.wareModel?.name || "کالا"}`}
      >
        <ArrowRightLeft className="size-3.5" />
      </Button>
    </Link>
  )
}

function GroupSection({
  title,
  icon: Icon,
  items,
  userUnitId,
  accentColor,
  defaultExpanded,
  onTransfer,
}: {
  title: string
  icon: React.ElementType
  items: Inventory[]
  userUnitId?: string
  accentColor: string
  defaultExpanded?: boolean
  onTransfer: (item: Inventory) => void
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? true)
  const totalQty = items.reduce((s, i) => s + (i.quantity ?? 0), 0)

  return (
    <Card variant="glass" className={cn("overflow-hidden", accentColor === "iris" ? "border-electric-iris/15" : "border-steel-border/10")}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-3 px-5 py-3.5 transition-colors",
          accentColor === "iris"
            ? "bg-electric-iris/[0.04] hover:bg-electric-iris/[0.07]"
            : "bg-white/[0.02] hover:bg-white/[0.04]",
        )}
      >
        <div className={cn(
          "size-8 rounded-lg flex items-center justify-center",
          accentColor === "iris" ? "bg-electric-iris/10" : "bg-white/[0.04]",
        )}>
          <Icon className={cn(
            "size-4",
            accentColor === "iris" ? "text-electric-iris" : "text-fog/50",
          )} />
        </div>
        <div className="flex-1 text-start">
          <p className={cn(
            "text-sm font-medium",
            accentColor === "iris" ? "text-glacier" : "text-moonlight/70",
          )}>
            {title}
          </p>
          <p className={cn(
            "text-[11px]",
            accentColor === "iris" ? "text-electric-iris/50" : "text-fog/40",
          )}>
            {items.length} کالا — مجموع: {totalQty.toLocaleString("fa-IR")} عدد
          </p>
        </div>
        <div className={cn(
          "shrink-0 transition-transform duration-200",
          expanded ? "rotate-180" : "",
        )}>
          {expanded ? <ChevronUp className="size-4 text-fog/50" /> : <ChevronDown className="size-4 text-fog/50" />}
        </div>
      </button>
      {expanded && (
        <div>
          {items.map((item) => (
            <InvRow key={item._id} item={item} userUnitId={userUnitId} onTransfer={onTransfer} />
          ))}
        </div>
      )}
    </Card>
  )
}

function EmptyInventoryState({ onReset, hasFilters }: { onReset: () => void; hasFilters: boolean }) {
  return (
    <Card variant="glass">
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
          <Package className="size-6 text-fog/30" />
        </div>
        <p className="text-sm font-medium text-fog/50">{hasFilters ? "کالایی یافت نشد" : "موجودی‌ای ثبت نشده است"}</p>
        <p className="text-xs text-fog/30 mt-1">
          {hasFilters
            ? "با تغییر جستجو یا مرتب‌سازی، کالای موردنظر را پیدا کنید."
            : "هنوز هیچ موجودی برای واحد شما ثبت نشده است."}
        </p>
        {hasFilters && (
          <Button variant="ghost" className="mt-4 gap-2 px-4" onClick={onReset}>
            <RotateCcw className="size-4" />
            پاک کردن فیلترها
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function InventoryClient({ items, counts, isWarehouseGrouped, userUnitId }: InventoryClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("createdAt-desc")
  const [transferTarget, setTransferTarget] = useState<Inventory | null>(null)
  const [toUnitId, setToUnitId] = useState("")
  const [transferQuantity, setTransferQuantity] = useState("")
  const [transferDescription, setTransferDescription] = useState("")
  const [transferring, setTransferring] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim()
    const list = items.filter((i) => matchesSearch(i, q))
    const sortAsc = sort.endsWith("-asc")
    let sorted = list
    if (sort.startsWith("createdAt")) {
      sorted = [...list].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""))
    } else {
      sorted = [...list].sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))
    }
    return sortAsc ? sorted : sorted.reverse()
  }, [items, search, sort])

  const centralItems = isWarehouseGrouped && userUnitId
    ? filtered.filter((i) => i.unit?._id === userUnitId)
    : filtered
  const unitItems = isWarehouseGrouped && userUnitId
    ? filtered.filter((i) => i.unit?._id !== userUnitId)
    : []

  const hasFilters = Boolean(search.trim() || sort !== "createdAt-desc")

  const handleReset = () => {
    setSearch("")
    setSort("createdAt-desc")
  }

  const handleTransfer = (item: Inventory) => {
    setTransferTarget(item)
    setToUnitId("")
    setTransferQuantity("")
    setTransferDescription("")
  }

  return (
    <div className="space-y-6">
      {/* 1. KPI cards */}
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

      {/* 2. Filter bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={setSearch}
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
            onValueChange={(v) => setSort(isSortKey(v || "") ? v as SortKey : "createdAt-desc")}
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

      {/* 3. Rich cards / grouped list */}
      {isWarehouseGrouped ? (
        <div className="space-y-4">
          <GroupSection
            title="انبار مرکزی"
            icon={Warehouse}
            items={centralItems}
            userUnitId={userUnitId}
            accentColor="iris"
            defaultExpanded
            onTransfer={handleTransfer}
          />

          {unitItems.length > 0 && (
            <GroupSection
              title="سایر واحدها"
              icon={Building2}
              items={unitItems}
              userUnitId={userUnitId}
              accentColor="muted"
              defaultExpanded={false}
              onTransfer={handleTransfer}
            />
          )}

          {centralItems.length === 0 && unitItems.length === 0 && (
            <EmptyInventoryState onReset={handleReset} hasFilters={hasFilters} />
          )}

          <TransferDialog
            transferTarget={transferTarget}
            toUnitId={toUnitId}
            setToUnitId={setToUnitId}
            transferQuantity={transferQuantity}
            setTransferQuantity={setTransferQuantity}
            transferDescription={transferDescription}
            setTransferDescription={setTransferDescription}
            transferring={transferring}
            setTransferring={setTransferring}
            onClose={() => setTransferTarget(null)}
            onSuccess={() => { setTransferTarget(null); router.refresh() }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
              {filtered.map((item) => (
                <InvCard key={item._id} item={item} userUnitId={userUnitId} />
              ))}
            </div>
          ) : (
            <EmptyInventoryState onReset={handleReset} hasFilters={hasFilters} />
          )}

          <TransferDialog
            transferTarget={transferTarget}
            toUnitId={toUnitId}
            setToUnitId={setToUnitId}
            transferQuantity={transferQuantity}
            setTransferQuantity={setTransferQuantity}
            transferDescription={transferDescription}
            setTransferDescription={setTransferDescription}
            transferring={transferring}
            setTransferring={setTransferring}
            onClose={() => setTransferTarget(null)}
            onSuccess={() => { setTransferTarget(null); router.refresh() }}
          />
        </div>
      )}
    </div>
  )
}

function TransferDialog({
  transferTarget,
  toUnitId,
  setToUnitId,
  transferQuantity,
  setTransferQuantity,
  transferDescription,
  setTransferDescription,
  transferring,
  setTransferring,
  onClose,
  onSuccess,
}: {
  transferTarget: Inventory | null
  toUnitId: string
  setToUnitId: (v: string) => void
  transferQuantity: string
  setTransferQuantity: (v: string) => void
  transferDescription: string
  setTransferDescription: (v: string) => void
  transferring: boolean
  setTransferring: (v: boolean) => void
  onClose: () => void
  onSuccess: () => void
}) {
  return (
    <Dialog open={!!transferTarget} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-glacier">انتقال موجودی</DialogTitle>
          <DialogDescription className="text-fog/70">
            {transferTarget?.ware?.name || transferTarget?.wareModel?.name || ""}
            {" — "}موجودی فعلی: {transferTarget?.quantity != null ? transferTarget.quantity.toLocaleString("fa-IR") : "۰"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-moonlight mb-1.5">واحد مقصد</label>
            <SearchSelect
              value={toUnitId}
              onChange={setToUnitId}
              fetcher={unitFetcher}
              placeholder="واحد مقصد را انتخاب کنید..."
              label="واحد مقصد"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-moonlight mb-1.5">تعداد انتقال</label>
            <input
              type="number"
              value={transferQuantity}
              onChange={(e) => setTransferQuantity(e.target.value)}
              className="w-full h-9 rounded-sm border border-steel-border/60 bg-transparent px-3 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="تعداد را وارد کنید"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-moonlight mb-1.5">توضیحات انتقال</label>
            <textarea
              value={transferDescription}
              onChange={(e) => setTransferDescription(e.target.value)}
              className="w-full rounded-sm border border-steel-border/60 bg-transparent px-3 py-2 text-sm text-moonlight outline-none transition-all duration-200 hover:border-frost-link/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
              rows={2}
              placeholder="دلیل انتقال..."
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={transferring}>
              انصراف
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!transferTarget || !toUnitId || !transferQuantity) return
                setTransferring(true)
                try {
                  const result = await transferWithAudit(
                    {
                      activeRoleId: getActiveRoleIdFromStore(),
                      fromUnitId: transferTarget.unit?._id || "",
                      toUnitId,
                      wareId: transferTarget.ware?._id || "",
                      quantity: Number(transferQuantity),
                      description: transferDescription || undefined,
                    },
                    { fromUnit: { _id: 1 }, toUnit: { _id: 1 }, quantity: 1 }
                  )
                  if (result.success) {
                    toast.success("موجودی با موفقیت انتقال یافت.")
                    onSuccess()
                  } else {
                    toast.error(result.body?.message || "خطا در انتقال موجودی")
                  }
                } catch {
                  toast.error("خطا در انتقال موجودی")
                } finally {
                  setTransferring(false)
                }
              }}
              disabled={transferring || !toUnitId || !transferQuantity}
              className="gap-1.5"
            >
              {transferring ? "در حال انتقال..." : "انتقال"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
