"use client"

import Link from "next/link"
import { Activity, ArrowRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"

interface StockMovement {
  _id: string
  quantity?: number
  reason?: string
  description?: string
  createdAt?: string
  unit?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
  ware?: { _id: string; name?: string }
}

interface StockMovementsClientProps {
  items: StockMovement[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
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
    key: "ware",
    label: "کالا",
    render: (item) => (
      <Link href={`/requests/stock-movements/${item._id}`} className="flex items-center gap-3 group">
        <div className="size-8 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
          <Activity className="size-4 text-electric-iris" />
        </div>
        <span className="text-moonlight font-medium group-hover:text-frost-link transition-colors">{item.ware?.name || item.wareModel?.name || "—"}</span>
      </Link>
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
    key: "description",
    label: "توضیحات",
    render: (item) => (
      <span className="text-fog text-sm max-w-[200px] truncate">{item.description || "—"}</span>
    ),
    hideOnCard: true,
  },
  {
    key: "createdAt",
    label: "تاریخ",
    render: (item) => (
      <span className="text-fog text-sm">
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
      </span>
    ),
    hideOnCard: true,
  },
]

function StockMovementsClient({ items, prevPageUrl, nextPageUrl, page }: StockMovementsClientProps) {
  return (
    <div className="space-y-6">
      <Link
        href="/requests"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>

      <PageHeader
        title="گردش کالا"
        description="تاریخچه جابه‌جایی کالا"
      />

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={true}
        renderCard={(item) => (
          <Link href={`/requests/stock-movements/${item._id}`} className="block">
            <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0", (item.quantity || 0) < 0 ? "bg-red-500/10" : "bg-emerald-500/10")}>
                  <Activity className={cn("size-5", (item.quantity || 0) < 0 ? "text-red-400" : "text-emerald-400")} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.ware?.name || item.wareModel?.name || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-sm font-mono", (item.quantity || 0) < 0 ? "text-destructive" : "text-emerald-400")} dir="ltr">
                      {(item.quantity || 0) < 0 ? "" : "+"}{item.quantity?.toLocaleString("fa-IR") || "۰"}
                    </span>
                    <span className="text-xs text-fog/50">{reasonLabels[item.reason || ""] || item.reason || ""}</span>
                  </div>
                </div>
              </div>
              {item.description && (
                <p className="text-xs text-fog/50 mt-2">{item.description}</p>
              )}
            </div>
          </Link>
        )}
        emptyTitle="حرکتی یافت نشد"
        emptyDescription="هنوز هیچ گردش کالایی ثبت نشده است."
      />

      <Pagination
        page={page}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
      />
    </div>
  )
}

export { StockMovementsClient }
