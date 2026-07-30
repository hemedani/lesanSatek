"use client"

import { Activity, ArrowUpRight, ArrowDownRight, User, Building2, Store, MessageSquareText, CalendarDays, FolderTree, Factory } from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"

interface StockMovement {
  _id: string
  quantity?: number
  reason?: string
  description?: string
  createdAt?: string
  unit?: { _id: string; name?: string; type?: string }
  createdBy?: { _id: string; first_name?: string; last_name?: string }
  store?: { _id: string; name?: string }
  ware?: { _id: string; name?: string; enName?: string; brand?: string }
  wareModel?: { _id: string; name?: string; enName?: string }
  wareGroup?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
}

interface StockMovementsClientProps {
  items: StockMovement[]
}

const reasonLabels: Record<string, { label: string; color: string }> = {
  goods_receipt: { label: "رسید کالا", color: "emerald" },
  goods_issue: { label: "خروج کالا", color: "red" },
  transfer_in: { label: "ورود انتقالی", color: "blue" },
  transfer_out: { label: "خروج انتقالی", color: "orange" },
  consumption: { label: "مصرف", color: "amber" },
  adjustment: { label: "تعدیل", color: "purple" },
  return: { label: "برگشت", color: "teal" },
  write_off: { label: "حذف", color: "rose" },
}

const reasonColors: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  teal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
}

function getReasonInfo(reason: string | undefined) {
  const info = reasonLabels[reason || ""]
  return info || { label: reason || "—", color: "gray" as const }
}

function getReasonBadge(reason: string | undefined) {
  const info = getReasonInfo(reason)
  const colorClass = reasonColors[info.color] || "bg-white/[0.04] text-fog border-white/[0.06]"
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", colorClass)}>
      {info.label}
    </Badge>
  )
}

const isInbound = (qty: number | undefined) => (qty || 0) > 0

const columns: Column<StockMovement>[] = [
  {
    key: "ware",
    label: "کالا",
    render: (item) => {
      const inbound = isInbound(item.quantity)
      return (
        <div className="flex items-center gap-3 min-w-0 max-w-[280px]">
          <div className={cn(
            "size-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
            inbound ? "bg-emerald-500/10" : "bg-red-500/10",
          )}>
            {inbound ? (
              <ArrowDownRight className="size-4 text-emerald-400" />
            ) : (
              <ArrowUpRight className="size-4 text-red-400" />
            )}
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
      )
    },
  },
  {
    key: "reason",
    label: "نوع",
    render: (item) => getReasonBadge(item.reason),
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
    label: "تغییر",
    render: (item) => {
      const inbound = isInbound(item.quantity)
      return (
        <span className={cn("text-sm font-bold font-mono", inbound ? "text-emerald-400" : "text-red-400")} dir="ltr">
          {inbound ? "+" : ""}{item.quantity?.toLocaleString("fa-IR") || "۰"}
        </span>
      )
    },
  },
  {
    key: "createdBy",
    label: "ثبت‌کننده",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog">{item.createdBy?.first_name || "—"}</span>
    ),
  },
  {
    key: "store",
    label: "انبار",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog">{item.store?.name || "—"}</span>
    ),
  },
  {
    key: "createdAt",
    label: "تاریخ",
    hideOnCard: true,
    render: (item) => (
      <span className="text-xs text-fog">{item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}</span>
    ),
  },
]

function StockMovementsClient({ items }: StockMovementsClientProps) {
  return (
    <DataTable
      columns={columns}
      data={items}
      keyExtractor={(item) => item._id}
      cardView={true}
      renderCard={(item) => {
        const inbound = isInbound(item.quantity)
        const qty = item.quantity ?? 0

        return (
          <div className="glass-card glass-card-hover-active rounded-xl overflow-hidden transition-all duration-200">
            {/* Header */}
            <div className={cn(
              "flex items-center gap-3 p-4 border-b",
              inbound ? "border-emerald-500/10 bg-emerald-500/[0.02]" : "border-red-500/10 bg-red-500/[0.02]",
            )}>
              <div className={cn(
                "size-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
                inbound ? "bg-emerald-500/10" : "bg-red-500/10",
              )}>
                <Activity className={cn("size-5", inbound ? "text-emerald-400" : "text-red-400")} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-moonlight truncate leading-5">
                    {item.ware?.name || item.wareModel?.name || "—"}
                  </p>
                  {getReasonBadge(item.reason)}
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

            {/* Quantity change row */}
            <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
              <div className={cn(
                "p-3 text-center bg-[#05060f]/60 col-span-2",
              )}>
                <p className="text-[10px] text-fog/50">تغییر موجودی</p>
                <p className={cn(
                  "text-lg font-bold font-mono leading-7",
                  inbound ? "text-emerald-400" : "text-red-400",
                )} dir="ltr">
                  {inbound ? "+" : ""}{qty.toLocaleString("fa-IR")}
                </p>
              </div>
              <div className="p-3 text-center bg-[#05060f]/60">
                <p className="text-[10px] text-fog/50">تاریخ</p>
                <p className="text-sm font-medium text-moonlight leading-7">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
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
                    <p className="text-[10px] text-fog/40">ثبت‌کننده</p>
                    <p className="text-xs text-moonlight truncate">
                      {item.createdBy ? `${item.createdBy.first_name || ""} ${item.createdBy.last_name || ""}`.trim() || "—" : "—"}
                    </p>
                  </div>
                </div>
                {item.store?.name && (
                  <div className="flex items-center gap-2">
                    <Store className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">انبار</p>
                      <p className="text-xs text-moonlight truncate">{item.store.name}</p>
                    </div>
                  </div>
                )}
                {item.description && (
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">توضیحات</p>
                      <p className="text-xs text-moonlight truncate">{item.description}</p>
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
      emptyTitle="حرکتی یافت نشد"
      emptyDescription="هنوز هیچ گردش کالایی در سازمان ثبت نشده است."
    />
  )
}

export { StockMovementsClient }
