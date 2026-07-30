"use client"

import { ScrollText } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"

interface ConsumptionRecord {
  _id: string
  quantity?: number
  notes?: string
  reason?: string
  consumedFor?: string
  consumedAt?: string
  createdAt?: string
  unit?: { _id: string; name?: string }
  ware?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
  consumedBy?: { _id: string; first_name?: string }
}

interface ConsumptionClientProps {
  items: ConsumptionRecord[]
}

const columns: Column<ConsumptionRecord>[] = [
  {
    key: "ware",
    label: "کالا",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
          <ScrollText className="size-4 text-electric-iris" />
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
    label: "مقدار",
    render: (item) => (
      <span className="font-mono text-sm text-moonlight" dir="ltr">
        {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
      </span>
    ),
  },
  {
    key: "consumedBy",
    label: "مصرف‌کننده",
    render: (item) => (
      <span className="text-fog text-sm">{item.consumedBy?.first_name || "—"}</span>
    ),
  },
  {
    key: "notes",
    label: "توضیحات",
    render: (item) => (
      <span className="text-fog text-sm max-w-[200px] truncate">{item.notes || "—"}</span>
    ),
    hideOnCard: true,
  },
  {
    key: "consumedAt",
    label: "تاریخ مصرف",
    render: (item) => (
      <span className="text-fog text-sm">{item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}</span>
    ),
    hideOnCard: true,
  },
  {
    key: "createdAt",
    label: "تاریخ ثبت",
    render: (item) => (
      <span className="text-fog text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}</span>
    ),
    hideOnCard: true,
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
        <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
              <ScrollText className="size-5 text-electric-iris" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-moonlight leading-6 truncate">
                {item.wareModel?.name || "—"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.unit?.name && <span className="text-xs text-fog/60">{item.unit.name}</span>}
                <span className="text-sm font-mono text-fog" dir="ltr">
                  {item.quantity?.toLocaleString("fa-IR")} عدد
                </span>
              </div>
            </div>
          </div>
          {item.notes && (
            <p className="text-xs text-fog/50 mt-2">{item.notes}</p>
          )}
        </div>
      )}
      emptyTitle="مصرفی ثبت نشده"
      emptyDescription="هنوز هیچ مصرف کالایی در سازمان ثبت نشده است."
    />
  )
}

export { ConsumptionClient }
