"use client"

import { ScrollText, User, Building2, MessageSquareText, CalendarDays, ClipboardList, FolderTree, Factory } from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"

interface ConsumptionRecord {
  _id: string
  quantity?: number
  notes?: string
  reason?: string
  consumedFor?: string
  consumedAt?: string
  createdAt?: string
  unit?: { _id: string; name?: string; type?: string }
  consumedBy?: { _id: string; first_name?: string; last_name?: string }
  inventory?: { _id: string; quantity?: number }
  ware?: { _id: string; name?: string; enName?: string; brand?: string }
  wareModel?: { _id: string; name?: string; enName?: string }
  wareGroup?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
}

interface ConsumptionClientProps {
  items: ConsumptionRecord[]
}

const columns: Column<ConsumptionRecord>[] = [
  {
    key: "ware",
    label: "کالای مصرف‌شده",
    render: (item) => (
      <div className="flex items-center gap-3 min-w-0 max-w-[280px]">
        <div className="size-9 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]">
          <ScrollText className="size-4 text-electric-iris" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-moonlight truncate leading-5 block">
            {item.ware?.name || item.wareModel?.name || "—"}
          </span>
          {item.ware?.brand && (
            <p className="text-[10px] text-fog/40 truncate leading-4">{item.ware.brand}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "unit",
    label: "واحد",
    render: (item) => (
      <span className="text-xs text-fog">{item.unit?.name || "—"}</span>
    ),
  },
  {
    key: "quantity",
    label: "مقدار",
    render: (item) => (
      <span className="text-sm font-semibold font-mono text-moonlight" dir="ltr">
        {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
      </span>
    ),
  },
  {
    key: "consumedBy",
    label: "مصرف‌کننده",
    render: (item) => (
      <span className="text-xs text-fog">{item.consumedBy?.first_name || "—"}</span>
    ),
  },
  {
    key: "consumedFor",
    label: "مصرف‌شونده",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog">{item.consumedFor || "—"}</span>
    ),
  },
  {
    key: "reason",
    label: "دلیل",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog max-w-[150px] truncate">{item.reason || "—"}</span>
    ),
  },
  {
    key: "notes",
    label: "توضیحات",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog max-w-[200px] truncate">{item.notes || "—"}</span>
    ),
  },
  {
    key: "consumedAt",
    label: "تاریخ مصرف",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog">{item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}</span>
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

function ConsumptionClient({ items }: ConsumptionClientProps) {
  return (
    <DataTable
      columns={columns}
      data={items}
      keyExtractor={(item) => item._id}
      cardView={true}
      renderCard={(item) => (
        <div className="glass-card glass-card-hover-active rounded-xl overflow-hidden transition-all duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-white/[0.04]">
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 ring-1 ring-inset ring-amber-500/15">
              <ScrollText className="size-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-moonlight truncate leading-5">
                {item.ware?.name || item.wareModel?.name || "—"}
              </p>
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

          {/* Quantity and info row */}
          <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
            <div className="p-3 text-center bg-[#05060f]/60">
              <p className="text-[10px] text-fog/50">مقدار مصرف</p>
              <p className="text-lg font-bold font-mono text-amber-400 leading-7" dir="ltr">
                {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
              </p>
            </div>
            <div className="p-3 text-center bg-[#05060f]/60">
              <p className="text-[10px] text-fog/50">مصرف‌کننده</p>
              <p className="text-sm font-medium text-moonlight leading-7 truncate">
                {item.consumedBy?.first_name || "—"}
              </p>
            </div>
            <div className="p-3 text-center bg-[#05060f]/60">
              <p className="text-[10px] text-fog/50">تاریخ مصرف</p>
              <p className="text-sm font-medium text-moonlight leading-7">
                {item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="p-4 space-y-1">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="size-3.5 text-fog/30 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-fog/40">واحد</p>
                  <p className="text-xs text-moonlight truncate">{item.unit?.name || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="size-3.5 text-fog/30 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-fog/40">مصرف‌شونده</p>
                  <p className="text-xs text-moonlight truncate">{item.consumedFor || "—"}</p>
                </div>
              </div>
              {item.reason && (
                <div className="flex items-center gap-2">
                  <MessageSquareText className="size-3.5 text-fog/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-fog/40">دلیل</p>
                    <p className="text-xs text-moonlight truncate">{item.reason}</p>
                  </div>
                </div>
              )}
              {item.notes && (
                <div className="flex items-center gap-2">
                  <ClipboardList className="size-3.5 text-fog/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-fog/40">توضیحات</p>
                    <p className="text-xs text-moonlight truncate">{item.notes}</p>
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
              {item.inventory && (
                <div className="flex items-center gap-2">
                  <ClipboardList className="size-3.5 text-fog/30 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-fog/40">موجودی پس از مصرف</p>
                    <p className="text-xs text-moonlight font-mono" dir="ltr">
                      {item.inventory.quantity != null ? item.inventory.quantity.toLocaleString("fa-IR") : "—"}
                    </p>
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
      )}
      emptyTitle="مصرفی ثبت نشده"
      emptyDescription="هنوز هیچ مصرف کالایی در سازمان ثبت نشده است."
    />
  )
}

export { ConsumptionClient }
