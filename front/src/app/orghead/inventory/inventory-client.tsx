"use client"

import {
  Warehouse,
  Building2,
  CalendarDays,
  Barcode,
  MapPin,
  Factory,
  FolderTree,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"

interface InventoryItem {
  _id: string
  quantity?: number
  minQuantity?: number
  maxQuantity?: number
  batchNo?: string
  location?: string
  expirationDate?: string
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

const columns: Column<InventoryItem>[] = [
  {
    key: "ware",
    label: "کالا",
    render: (item) => {
      const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity
      return (
        <div className="flex items-center gap-3 min-w-0 max-w-[280px]">
          <div className={cn(
            "size-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
            isLowStock ? "bg-ember/10" : "bg-electric-iris/10",
          )}>
            <Warehouse className={cn("size-4", isLowStock ? "text-ember" : "text-electric-iris")} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-moonlight truncate leading-5">
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
            {item.ware?.enName && item.ware.enName !== item.ware.name && (
              <p className="text-[10px] text-fog/30 truncate leading-4">{item.ware.enName}</p>
            )}
          </div>
        </div>
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
    label: "واحد مصرف‌کننده",
    render: (item) => (
      <div>
        <span className="text-xs text-fog">{item.unit?.name || "—"}</span>
        {item.unit?.type && <p className="text-[10px] text-fog/40">{item.unit.type}</p>}
      </div>
    ),
  },
  {
    key: "warehouseUnit",
    label: "انبار",
    render: (item) => (
      <span className="text-xs text-fog">{item.warehouseUnit?.name || "—"}</span>
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
              {item.maxQuantity != null && ` · حداکثر: ${item.maxQuantity.toLocaleString("fa-IR")}`}
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
  {
    key: "expirationDate",
    label: "تاریخ انقضا",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog">{item.expirationDate ? new Date(item.expirationDate).toLocaleDateString("fa-IR") : "—"}</span>
    ),
  },
  {
    key: "createdAt",
    label: "تاریخ ثبت",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}</span>
    ),
  },
]

function InventoryClient({ items }: { items: InventoryItem[] }) {
  return (
    <DataTable
      columns={columns}
      data={items}
      keyExtractor={(item) => item._id}
      cardView={true}
      renderCard={(item) => {
        const isLowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity

        return (
          <div className="glass-card glass-card-hover-active rounded-xl overflow-hidden transition-all duration-200">
            {/* Header */}
            <div className={cn(
              "flex items-center gap-3 p-4 border-b",
              isLowStock ? "border-ember/10 bg-ember/[0.02]" : "border-white/[0.04]",
            )}>
              <div className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
                isLowStock ? "bg-ember/10" : "bg-electric-iris/10",
              )}>
                <Warehouse className={cn("size-5", isLowStock ? "text-ember" : "text-electric-iris")} />
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
        )
      }}
      emptyTitle="موجودی‌ای یافت نشد"
      emptyDescription="هنوز هیچ موجودی در سازمان ثبت نشده است."
    />
  )
}

export { InventoryClient }
