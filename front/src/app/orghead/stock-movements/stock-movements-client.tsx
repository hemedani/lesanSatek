"use client"

import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"

interface StockMovement {
  _id: string
  quantity?: number
  reason?: string
  description?: string
  createdAt?: string
  unit?: { _id: string; name?: string }
  createdBy?: { _id: string; first_name?: string }
  wareModel?: { _id: string; name?: string }
}

interface StockMovementsClientProps {
  items: StockMovement[]
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

const columns: Column<StockMovement>[] = [
  {
    key: "wareModel",
    label: "کالا",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
          <Activity className="size-4 text-electric-iris" />
        </div>
        <span className="text-moonlight font-medium">{item.wareModel?.name || "—"}</span>
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
    label: "تغییر",
    render: (item) => (
      <span className={cn("font-mono text-sm", (item.quantity || 0) < 0 ? "text-destructive" : "text-emerald-400")} dir="ltr">
        {(item.quantity || 0) < 0 ? "" : "+"}{item.quantity?.toLocaleString("fa-IR") || "۰"}
      </span>
    ),
  },
  {
    key: "reason",
    label: "نوع",
    render: (item) => (
      <span className="text-fog text-sm">{reasonLabels[item.reason || ""] || item.reason || "—"}</span>
    ),
  },
  {
    key: "createdBy",
    label: "ثبت‌کننده",
    render: (item) => (
      <span className="text-fog text-sm">{item.createdBy?.first_name || "—"}</span>
    ),
    hideOnCard: true,
  },
  {
    key: "createdAt",
    label: "تاریخ",
    render: (item) => (
      <span className="text-fog text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}</span>
    ),
    hideOnCard: true,
  },
]

function StockMovementsClient({ items }: StockMovementsClientProps) {
  return (
    <DataTable
      columns={columns}
      data={items}
      keyExtractor={(item) => item._id}
      cardView={true}
      renderCard={(item) => (
        <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", (item.quantity || 0) < 0 ? "bg-red-500/10" : "bg-emerald-500/10")}>
              <Activity className={cn("size-5", (item.quantity || 0) < 0 ? "text-red-400" : "text-emerald-400")} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-moonlight leading-6 truncate">
                {item.wareModel?.name || "—"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.unit?.name && <span className="text-xs text-fog/60">{item.unit.name}</span>}
                <span className={cn("text-sm font-mono", (item.quantity || 0) < 0 ? "text-destructive" : "text-emerald-400")} dir="ltr">
                  {(item.quantity || 0) < 0 ? "" : "+"}{item.quantity?.toLocaleString("fa-IR") || "۰"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-fog/40">
            <span>{reasonLabels[item.reason || ""] || item.reason || ""}</span>
            {item.createdBy?.first_name && <span>توسط {item.createdBy.first_name}</span>}
          </div>
          {item.description && (
            <p className="text-xs text-fog/50 mt-1">{item.description}</p>
          )}
        </div>
      )}
      emptyTitle="حرکتی یافت نشد"
      emptyDescription="هنوز هیچ گردش کالایی در سازمان ثبت نشده است."
    />
  )
}

export { StockMovementsClient }
