"use client"

import { useState } from "react"
import { Warehouse, Package, ChevronDown, ChevronUp, Building2, AlertTriangle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InventoryItem {
  _id?: string
  quantity?: number
  minQuantity?: number
  maxQuantity?: number
  batchNo?: string
  expirationDate?: string
  location?: string
  lastCountedAt?: string
  createdAt?: string
  updatedAt?: string
  unit?: { _id?: string; name?: string; type?: string }
  warehouseUnit?: { _id?: string; name?: string }
  ware?: { _id?: string; name?: string }
  wareModel?: { _id?: string; name?: string }
}

interface InventoryGroup {
  items: InventoryItem[]
  total: number
  page?: number
  limit?: number
}

interface WarehouseInventoryPanelProps {
  centralWarehouse: InventoryGroup
  unitWarehouses: InventoryGroup
  requestedQuantity: number
  wareModelName?: string
}

function formatNum(n: number | undefined | null): string {
  if (n == null) return "—"
  return n.toLocaleString("fa-IR")
}

function InventoryItemRow({ item, isCentral }: { item: InventoryItem; isCentral?: boolean }) {
  const qty = item.quantity ?? 0
  const minQ = item.minQuantity
  const maxQ = item.maxQuantity
  const isLow = minQ != null && qty < minQ
  const isOver = maxQ != null && qty > maxQ

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        isCentral
          ? "border-electric-iris/25 bg-electric-iris/[0.04]"
          : "border-steel-border/15 bg-white/[0.02]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "size-7 rounded-lg flex items-center justify-center shrink-0",
              isCentral
                ? "bg-electric-iris/15"
                : "bg-zinc-400/10",
            )}
          >
            {isCentral ? (
              <Warehouse className="size-3.5 text-electric-iris" />
            ) : (
              <Building2 className="size-3.5 text-fog/60" />
            )}
          </div>
          <div className="min-w-0">
            <p className={cn(
              "text-sm font-medium truncate",
              isCentral ? "text-glacier" : "text-moonlight",
            )}>
              {item.unit?.name || "—"}
            </p>
            {item.unit?.type && isCentral && (
              <p className="text-[10px] text-electric-iris/60 mt-px">انبار مرکزی</p>
            )}
            {item.location && (
              <p className="text-[10px] text-fog/40 mt-px">{item.location}</p>
            )}
          </div>
        </div>
        <div className="text-end shrink-0">
          <p className={cn(
            "text-base font-semibold font-mono leading-tight",
            isLow ? "text-rose-400" : isOver ? "text-amber-400" : isCentral ? "text-emerald-400" : "text-moonlight",
          )}>
            {formatNum(qty)}
          </p>
          {(minQ != null || maxQ != null) && (
            <p className="text-[10px] text-fog/40 mt-px">
              {minQ != null && `حداقل ${formatNum(minQ)}`}
              {minQ != null && maxQ != null && " / "}
              {maxQ != null && `حداکثر ${formatNum(maxQ)}`}
            </p>
          )}
        </div>
      </div>
      {(item.batchNo || item.expirationDate) && (
        <div className="flex items-center gap-3 mt-2 text-[10px] text-fog/40">
          {item.batchNo && <span dir="ltr">{item.batchNo}</span>}
          {item.expirationDate && (
            <span>انقضا: {new Date(item.expirationDate).toLocaleDateString("fa-IR")}</span>
          )}
        </div>
      )}
    </div>
  )
}

function WarehouseInventoryPanel({
  centralWarehouse,
  unitWarehouses,
  requestedQuantity,
  wareModelName,
}: WarehouseInventoryPanelProps) {
  const [showUnits, setShowUnits] = useState(false)

  const totalCentral = (centralWarehouse.items || []).reduce((s, i) => s + (i.quantity ?? 0), 0)
  const totalUnits = (unitWarehouses.items || []).reduce((s, i) => s + (i.quantity ?? 0), 0)
  const totalAvailable = totalCentral + totalUnits
  const isSufficient = totalAvailable >= requestedQuantity

  return (
    <Card variant="glass" className="border-electric-iris/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <Package className="size-4 text-electric-iris" />
          </div>
          <CardTitle className="text-sm font-medium text-frost-link">موجودی انبار</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {wareModelName && (
          <p className="text-xs text-fog/60">{wareModelName}</p>
        )}

        <div className={cn(
          "rounded-lg border p-3 text-center",
          isSufficient
            ? "border-emerald-500/20 bg-emerald-500/[0.04]"
            : "border-amber-500/20 bg-amber-500/[0.04]",
        )}>
          {isSufficient ? (
            <CheckCircle className="size-5 text-emerald-400 mx-auto mb-1" />
          ) : (
            <AlertTriangle className="size-5 text-amber-400 mx-auto mb-1" />
          )}
          <p className={cn(
            "text-sm font-medium",
            isSufficient ? "text-emerald-400" : "text-amber-400",
          )}>
            موجودی کل: {formatNum(totalAvailable)}
          </p>
          <p className="text-[11px] text-fog/50 mt-0.5">
            درخواست: {formatNum(requestedQuantity)}
          </p>
        </div>

        {centralWarehouse.items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-glacier flex items-center gap-1.5">
              <Warehouse className="size-3.5 text-electric-iris" />
              انبار مرکزی
              <span className="text-fog/50 font-normal">({formatNum(totalCentral)})</span>
            </p>
            <div className="space-y-2">
              {centralWarehouse.items.map((item) => (
                <InventoryItemRow key={item._id || ""} item={item} isCentral />
              ))}
            </div>
          </div>
        )}

        {unitWarehouses.items.length > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowUnits(!showUnits)}
              className="flex items-center gap-1.5 text-xs text-fog/60 hover:text-fog transition-colors w-full"
            >
              {showUnits ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              سایر واحدها ({unitWarehouses.items.length})
              <span className="text-fog/40 ms-auto text-[10px]">{formatNum(totalUnits)}</span>
            </button>
            {showUnits && (
              <div className="space-y-2 pt-1">
                {unitWarehouses.items.map((item) => (
                  <InventoryItemRow key={item._id || ""} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {centralWarehouse.items.length === 0 && unitWarehouses.items.length === 0 && (
          <p className="text-xs text-fog/50 text-center py-3">هیچ موجودی برای این کالا یافت نشد</p>
        )}
      </CardContent>
    </Card>
  )
}

export { WarehouseInventoryPanel, type InventoryItem, type InventoryGroup, type WarehouseInventoryPanelProps }
