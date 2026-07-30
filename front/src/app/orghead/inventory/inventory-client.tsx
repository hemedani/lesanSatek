"use client"

import Link from "next/link"
import { Warehouse, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { PageHeader } from "@/components/ui/page-header"

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
}

const columns: Column<InventoryItem>[] = [
  {
    key: "ware",
    label: "کالا",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
          <Warehouse className="size-4 text-electric-iris" />
        </div>
        <span className="text-moonlight font-medium">{item.ware?.name || item.wareModel?.name || "—"}</span>
      </div>
    ),
  },
  {
    key: "unit",
    label: "واحد",
    render: (item) => (
      <span className="text-fog text-sm">{item.unit?.name || "—"}</span>
    ),
  },
  {
    key: "quantity",
    label: "موجودی",
    render: (item) => (
      <span className="font-mono text-sm" dir="ltr">
        {item.quantity != null ? (
          <span className={cn(item.minQuantity != null && item.quantity < item.minQuantity ? "text-destructive font-medium" : "text-moonlight")}>
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
    key: "createdAt",
    label: "تاریخ ایجاد",
    render: (item) => (
      <span className="text-fog text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}</span>
    ),
    hideOnCard: true,
  },
]

function InventoryClient({ items }: InventoryClientProps) {
  return (
    <DataTable
      columns={columns}
      data={items}
      keyExtractor={(item) => item._id}
      cardView={true}
      renderCard={(item) => (
        <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
              <Warehouse className="size-5 text-electric-iris" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-moonlight leading-6 truncate">
                {item.ware?.name || item.wareModel?.name || "—"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.unit?.name && <span className="text-xs text-fog/60">{item.unit.name}</span>}
                {item.quantity != null && (
                  <span className={cn("text-sm font-mono", item.minQuantity != null && item.quantity < item.minQuantity ? "text-destructive" : "text-fog")} dir="ltr">
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
        </div>
      )}
      emptyTitle="موجودی‌ای یافت نشد"
      emptyDescription="هنوز هیچ موجودی در سازمان ثبت نشده است."
    />
  )
}

export { InventoryClient }
