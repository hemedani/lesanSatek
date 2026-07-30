"use client"

import Link from "next/link"
import { ScrollText, ArrowRight, Package, User, FileText, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ConsumptionRecord {
  _id: string
  quantity?: number
  notes?: string
  reason?: string
  consumedAt?: string
  createdAt?: string
  updatedAt?: string
  unit?: { _id: string; name?: string }
  consumedBy?: { _id: string; first_name?: string; last_name?: string }
  wareModel?: { _id: string; name?: string }
  ware?: { _id: string; name?: string }
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

function ConsumptionDetailClient({ item }: { item: ConsumptionRecord }) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        href="/requests/consumption"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowRight className="size-4" />
        بازگشت به مصرف کالا
      </Link>

      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 shrink-0">
          <ScrollText className="size-7 text-amber-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-glacier leading-7 truncate">
            {item.ware?.name || item.wareModel?.name || "مصرف کالا"}
          </h1>
          <p className="text-sm text-fog mt-1">مصرف {item.quantity?.toLocaleString("fa-IR")} عددی</p>
        </div>
      </div>

      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-frost-link">جزئیات مصرف</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <DetailRow
            icon={<Package className="size-3.5 text-frost-link" />}
            label="کالا"
            value={item.ware?.name || item.wareModel?.name || "—"}
          />
          <DetailRow
            icon={<Package className="size-3.5 text-frost-link" />}
            label="مقدار"
            value={<span className="font-mono" dir="ltr">{item.quantity?.toLocaleString("fa-IR") || "۰"} عدد</span>}
          />
          {item.notes && (
            <DetailRow
              icon={<FileText className="size-3.5 text-frost-link" />}
              label="توضیحات"
              value={item.notes}
            />
          )}
          {item.unit?.name && (
            <DetailRow
              icon={<Package className="size-3.5 text-frost-link" />}
              label="واحد"
              value={item.unit.name}
            />
          )}
          {item.consumedBy && (
            <DetailRow
              icon={<User className="size-3.5 text-frost-link" />}
              label="مصرف‌کننده"
              value={`${item.consumedBy.first_name || ""} ${item.consumedBy.last_name || ""}`.trim() || "—"}
            />
          )}
          <DetailRow
            icon={<CalendarDays className="size-3.5 text-frost-link" />}
            label="تاریخ مصرف"
            value={item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" }) : "—"}
          />
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

export { ConsumptionDetailClient }
