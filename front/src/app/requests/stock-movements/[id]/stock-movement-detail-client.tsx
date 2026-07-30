"use client"

import Link from "next/link"
import { Activity, ArrowRight, Package, User, FileText, Hash, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StockMovement {
  _id: string
  quantity?: number
  balanceBefore?: number
  balanceAfter?: number
  reason?: string
  description?: string
  createdAt?: string
  updatedAt?: string
  unit?: { _id: string; name?: string }
  createdBy?: { _id: string; first_name?: string; last_name?: string }
  wareModel?: { _id: string; name?: string }
  ware?: { _id: string; name?: string }
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

const reasonBgs: Record<string, string> = {
  goods_receipt: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  goods_issue: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  transfer_in: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  transfer_out: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  consumption: "bg-red-500/10 text-red-400 border-red-500/20",
  adjustment: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  return: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  write_off: "bg-fog/10 text-fog border-fog/20",
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

function StockMovementDetailClient({ item }: { item: StockMovement }) {
  const isPositive = (item.quantity || 0) >= 0
  const reasonKey = item.reason || ""

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href="/requests/stock-movements"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowRight className="size-4" />
        بازگشت به گردش کالا
      </Link>

      <div className="flex items-center gap-4">
        <div className={cn("flex size-14 items-center justify-center rounded-2xl shrink-0", isPositive ? "bg-emerald-500/10" : "bg-red-500/10")}>
          <Activity className={cn("size-7", isPositive ? "text-emerald-400" : "text-red-400")} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-glacier leading-7 truncate">
            {item.ware?.name || item.wareModel?.name || "گردش کالا"}
          </h1>
          <span className={cn("inline-block mt-1 px-2.5 py-0.5 text-xs font-medium rounded-full border", reasonBgs[reasonKey] || "bg-fog/10 text-fog border-fog/20")}>
            {reasonLabels[reasonKey] || reasonKey || "—"}
          </span>
        </div>
      </div>

      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-frost-link">جزئیات گردش</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <DetailRow
            icon={<Package className="size-3.5 text-frost-link" />}
            label="کالا"
            value={item.ware?.name || item.wareModel?.name || "—"}
          />
          <DetailRow
            icon={<Hash className="size-3.5 text-frost-link" />}
            label="تعداد"
            value={(
              <span className={cn("font-mono", isPositive ? "text-emerald-400" : "text-destructive")} dir="ltr">
                {isPositive ? "+" : ""}{item.quantity?.toLocaleString("fa-IR") || "۰"}
              </span>
            )}
          />
          <DetailRow
            icon={<Hash className="size-3.5 text-frost-link" />}
            label="موجودی قبل"
            value={<span className="font-mono" dir="ltr">{item.balanceBefore?.toLocaleString("fa-IR") || "—"}</span>}
          />
          <DetailRow
            icon={<Hash className="size-3.5 text-frost-link" />}
            label="موجودی بعد"
            value={<span className="font-mono" dir="ltr">{item.balanceAfter?.toLocaleString("fa-IR") || "—"}</span>}
          />
          <DetailRow
            icon={<Activity className="size-3.5 text-frost-link" />}
            label="نوع"
            value={reasonLabels[reasonKey] || reasonKey || "—"}
          />
          {item.description && (
            <DetailRow
              icon={<FileText className="size-3.5 text-frost-link" />}
              label="توضیحات"
              value={item.description}
            />
          )}
          {item.unit?.name && (
            <DetailRow
              icon={<Package className="size-3.5 text-frost-link" />}
              label="واحد"
              value={item.unit.name}
            />
          )}
          {item.createdBy && (
            <DetailRow
              icon={<User className="size-3.5 text-frost-link" />}
              label="ثبت‌کننده"
              value={`${item.createdBy.first_name || ""} ${item.createdBy.last_name || ""}`.trim() || "—"}
            />
          )}
          <DetailRow
            icon={<CalendarDays className="size-3.5 text-frost-link" />}
            label="تاریخ ثبت"
            value={item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export { StockMovementDetailClient }
