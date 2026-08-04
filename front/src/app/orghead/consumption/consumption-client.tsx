"use client"

import {
  ScrollText, User, Building2, MessageSquareText, CalendarDays, ClipboardList, FolderTree, Factory,
  Package, ArrowDownLeft, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

export interface ConsumptionRecord {
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

export interface ConsumptionCounts {
  total: number
}

interface ConsumptionClientProps {
  items: ConsumptionRecord[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages?: number
  counts: ConsumptionCounts
}

function ConsumptionCard({ item }: { item: ConsumptionRecord }) {
  const wareName = item.ware?.name || item.wareModel?.name || "کالای بدون نام"

  return (
    <div className="group block h-full rounded-2xl outline-none">
      <div className="glass-card glass-card-hover-active flex h-full flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.04]">
          <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 ring-1 ring-inset ring-amber-500/15">
            <ScrollText className="size-5 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-moonlight truncate leading-5">
              {wareName}
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
        <div className="p-4 space-y-1 flex-1">
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
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-frost-link/5 text-fog border-white/[0.06]">
                  {item.wareType.name}
                </Badge>
              )}
              {item.wareClass?.name && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-frost-link/5 text-fog border-white/[0.06]">
                  {item.wareClass.name}
                </Badge>
              )}
              {item.wareGroup?.name && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-frost-link/5 text-fog border-white/[0.06]">
                  {item.wareGroup.name}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ConsumptionClient({ items, prevUrl, nextUrl, page, totalPages, counts }: ConsumptionClientProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-5">
        <StatCard
          label="کل مصرف‌ها"
          value={counts.total}
          icon={Package}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
          subtitle="مصرف‌های ثبت‌شده سازمان"
        />
        <StatCard
          label="کالاهای مصرف‌شده"
          value={items.reduce((acc, it) => acc + (it.quantity != null ? it.quantity : 0), 0)}
          icon={ArrowDownLeft}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
          subtitle="مقدار در این صفحه"
        />
        <StatCard
          label="مصرف‌کنندگان"
          value={new Set(items.map((it) => it.consumedBy?._id).filter(Boolean)).size}
          icon={Users}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
          subtitle="افراد این صفحه"
        />
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <ConsumptionCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ScrollText}
          title="مصرفی ثبت نشده"
          description="هنوز هیچ مصرف کالایی در سازمان ثبت نشده است."
        />
      )}

      {(prevUrl || nextUrl) && (
        <Pagination
          prevUrl={prevUrl}
          nextUrl={nextUrl}
          page={page}
          totalPages={totalPages}
          className="pt-2 border-t border-steel-border/15"
        />
      )}
    </div>
  )
}

export { ConsumptionClient }