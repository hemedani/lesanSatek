"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Warehouse, ArrowRightLeft, Building2, ChevronDown, ChevronUp, Package, Barcode, MapPin, CalendarDays, Factory, FolderTree, Box } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SearchSelect } from "@/components/form/form-search-select"
import type { SearchSelectOption } from "@/components/form/form-search-select"
import { transferWithAudit } from "@/app/actions/inventory/transferWithAudit"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface Inventory {
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
  items: Inventory[]
  isWarehouseGrouped?: boolean
  userUnitId?: string
}

const unitFetcher = async (q?: string): Promise<SearchSelectOption[]> => {
  const result = await getUnits({ activeRoleId: getActiveRoleIdFromStore(), page: 1, limit: 100, search: q }, { _id: 1, name: 1 })
  if (!result.success) return []
  return result.body.map((s: { _id: string; name?: string }) => ({ _id: s._id, name: s.name || "" }))
}

function InvCard({ item, userUnitId }: { item: Inventory; userUnitId?: string }) {
  const isOwn = userUnitId ? item.unit?._id === userUnitId : false
  const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity

  return (
    <div className={cn(
      "rounded-xl overflow-hidden transition-all",
      isOwn
        ? "glass-card glass-card-hover-active border-electric-iris/20"
        : "glass-card glass-card-hover-active border-steel-border/15",
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b",
        isOwn ? "border-electric-iris/10" : "border-white/[0.04]",
        isLowStock && "bg-ember/[0.02]",
      )}>
        <div className={cn(
          "size-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset",
          isOwn
            ? "bg-electric-iris/10 ring-electric-iris/15"
            : "bg-white/[0.03] ring-steel-border/15",
        )}>
          {isOwn ? (
            <Box className="size-5 text-electric-iris" />
          ) : (
            <Building2 className="size-5 text-fog/50" />
          )}
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
              <span className={cn(
                "text-[10px] flex items-center gap-1",
                isOwn ? "text-electric-iris/60" : "text-fog/50",
              )}>
                <Factory className="size-3" />
                {item.ware.brand}
              </span>
            )}
            {item.wareModel?.name && (
              <span className="text-[10px] text-fog/40">مدل: {item.wareModel.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Quantity row */}
      <div className={cn(
        "grid grid-cols-3 gap-px",
        isOwn ? "bg-electric-iris/[0.06]" : "bg-white/[0.04]",
      )}>
        <div className={cn(
          "p-3 text-center",
          isOwn ? "bg-[#05060f]/60" : "bg-[#05060f]/60",
        )}>
          <p className="text-[10px] text-fog/50">موجودی</p>
          <p className={cn(
            "text-lg font-bold font-mono leading-7",
            isLowStock ? "text-ember" : "text-glacier",
          )} dir="ltr">
            {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
          </p>
        </div>
        <div className="p-3 text-center bg-[#05060f]/60">
          <p className="text-[10px] text-fog/50">حداقل</p>
          <p className="text-lg font-bold font-mono text-fog leading-7" dir="ltr">
            {item.minQuantity != null ? item.minQuantity.toLocaleString("fa-IR") : "—"}
          </p>
        </div>
        <div className="p-3 text-center bg-[#05060f]/60">
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
              <p className={cn(
                "text-xs truncate",
                isOwn ? "text-electric-iris" : "text-moonlight",
              )}>{item.unit?.name || "—"}</p>
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
  )
}

function InvRow({ item, userUnitId, onTransfer }: { item: Inventory; userUnitId?: string; onTransfer: (item: Inventory) => void }) {
  const isOwn = userUnitId ? item.unit?._id === userUnitId : false
  const qty = item.quantity ?? 0
  const isLow = item.minQuantity != null && qty < item.minQuantity

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-steel-border/10 last:border-b-0 transition-colors hover:bg-white/[0.02]">
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
        onClick={() => onTransfer(item)}
      >
        <ArrowRightLeft className="size-3.5" />
      </Button>
    </div>
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

export function InventoryClient({ items, isWarehouseGrouped, userUnitId }: InventoryClientProps) {
  const router = useRouter()
  const [transferTarget, setTransferTarget] = useState<Inventory | null>(null)
  const [toUnitId, setToUnitId] = useState("")
  const [transferQuantity, setTransferQuantity] = useState("")
  const [transferDescription, setTransferDescription] = useState("")
  const [transferring, setTransferring] = useState(false)

  const centralItems = isWarehouseGrouped && userUnitId
    ? items.filter((i) => i.unit?._id === userUnitId)
    : items
  const unitItems = isWarehouseGrouped && userUnitId
    ? items.filter((i) => i.unit?._id !== userUnitId)
    : []

  const handleTransfer = (item: Inventory) => {
    setTransferTarget(item)
    setToUnitId("")
    setTransferQuantity("")
    setTransferDescription("")
  }

  if (isWarehouseGrouped) {
    return (
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
          <Card variant="glass">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
                <Package className="size-6 text-fog/30" />
              </div>
              <p className="text-sm font-medium text-fog/50">موجودی‌ای یافت نشد</p>
              <p className="text-xs text-fog/30 mt-1">هنوز هیچ موجودی برای واحد شما ثبت نشده است.</p>
            </CardContent>
          </Card>
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
    )
  }

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <InvCard key={item._id} item={item} userUnitId={userUnitId} />
          ))}
        </div>
      ) : (
        <Card variant="glass">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-steel-border/15">
              <Package className="size-6 text-fog/30" />
            </div>
            <p className="text-sm font-medium text-fog/50">موجودی‌ای یافت نشد</p>
            <p className="text-xs text-fog/30 mt-1">هنوز هیچ موجودی برای واحد شما ثبت نشده است.</p>
          </CardContent>
        </Card>
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
