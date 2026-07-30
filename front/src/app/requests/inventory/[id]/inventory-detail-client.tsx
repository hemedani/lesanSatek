"use client"

import Link from "next/link"
import { Warehouse, ArrowRight, Package, Hash, MapPin, CalendarDays, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InventoryItem {
  _id: string
  quantity?: number
  minQuantity?: number
  maxQuantity?: number
  batchNo?: string
  location?: string
  createdAt?: string
  updatedAt?: string
  unit?: { _id: string; name?: string }
  warehouseUnit?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
  ware?: { _id: string; name?: string; wareModel?: { _id: string; name?: string } }
}

interface DetailRowProps {
  icon: React.ReactNode
  label: string
  value: string | React.ReactNode
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-b-0">
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-md bg-white/[0.04] shrink-0">
          {icon}
        </div>
        <span className="text-sm text-fog">{label}</span>
      </div>
      <div className="text-sm text-moonlight font-medium text-end">{value}</div>
    </div>
  )
}

function InventoryDetailClient({ item }: { item: InventoryItem }) {
  const lowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href="/requests/inventory"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowRight className="size-4" />
        بازگشت به انبار واحد
      </Link>

      <div className="flex items-center gap-4">
        <div className={cn("flex size-14 items-center justify-center rounded-2xl shrink-0", lowStock ? "bg-red-500/10" : "bg-emerald-500/10")}>
          <Warehouse className={cn("size-7", lowStock ? "text-red-400" : "text-emerald-400")} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-glacier leading-7 truncate">
            {item.ware?.name || item.wareModel?.name || "کالا"}
          </h1>
          <p className="text-sm text-fog mt-1">
            {item.ware?.wareModel?.name || item.wareModel?.name || ""}
          </p>
        </div>
      </div>

      {lowStock && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="size-4 shrink-0" />
          موجودی این کالا کمتر از حداقل مقدار است
        </div>
      )}

      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-frost-link">جزئیات موجودی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <DetailRow
            icon={<Package className="size-3.5 text-frost-link" />}
            label="کالا"
            value={item.ware?.name || item.wareModel?.name || "—"}
          />
          <DetailRow
            icon={<Package className="size-3.5 text-frost-link" />}
            label="مدل کالا"
            value={item.ware?.wareModel?.name || item.wareModel?.name || "—"}
          />
          <DetailRow
            icon={<Hash className="size-3.5 text-frost-link" />}
            label="موجودی فعلی"
            value={(
              <span className={cn("font-mono", lowStock ? "text-destructive" : "text-emerald-400")} dir="ltr">
                {item.quantity?.toLocaleString("fa-IR") || "۰"} عدد
              </span>
            )}
          />
          {item.minQuantity != null && (
            <DetailRow
              icon={<Hash className="size-3.5 text-frost-link" />}
              label="حداقل موجودی"
              value={<span className="font-mono" dir="ltr">{item.minQuantity.toLocaleString("fa-IR")} عدد</span>}
            />
          )}
          {item.maxQuantity != null && (
            <DetailRow
              icon={<Hash className="size-3.5 text-frost-link" />}
              label="حداکثر موجودی"
              value={<span className="font-mono" dir="ltr">{item.maxQuantity.toLocaleString("fa-IR")} عدد</span>}
            />
          )}
          {item.batchNo && (
            <DetailRow
              icon={<Hash className="size-3.5 text-frost-link" />}
              label="شماره سریال"
              value={<span className="font-mono" dir="ltr">{item.batchNo}</span>}
            />
          )}
          {item.location && (
            <DetailRow
              icon={<MapPin className="size-3.5 text-frost-link" />}
              label="موقعیت"
              value={item.location}
            />
          )}
          {item.unit?.name && (
            <DetailRow
              icon={<Package className="size-3.5 text-frost-link" />}
              label="واحد"
              value={item.unit.name}
            />
          )}
          {item.warehouseUnit?.name && (
            <DetailRow
              icon={<Warehouse className="size-3.5 text-frost-link" />}
              label="انبار"
              value={item.warehouseUnit.name}
            />
          )}
          <DetailRow
            icon={<CalendarDays className="size-3.5 text-frost-link" />}
            label="تاریخ ایجاد"
            value={item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }) : "—"}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export { InventoryDetailClient }
