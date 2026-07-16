"use client"

import Link from "next/link"
import { Warehouse, ArrowRight } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

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
  prevUrl: string
  nextUrl: string
  page: number
}

const columns: Column<InventoryItem>[] = [
  {
    key: "wareModel",
    label: "کالا",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
          <Warehouse className="size-4 text-electric-iris" />
        </div>
        <span className="text-moonlight font-medium">{item.wareModel?.name || item.ware?.name || "—"}</span>
      </div>
    ),
  },
  {
    key: "quantity",
    label: "موجودی",
    render: (item) => (
      <span className="font-mono text-sm" dir="ltr">
        {item.quantity != null ? (
          <span className={cn(
            item.minQuantity != null && item.quantity < item.minQuantity
              ? "text-destructive font-medium"
              : "text-moonlight"
          )}>
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
    key: "location",
    label: "موقعیت",
    render: (item) => (
      <span className="text-fog text-sm">{item.location || "—"}</span>
    ),
    hideOnCard: true,
  },
]

function InventoryClient({ items, prevUrl, nextUrl, page }: InventoryClientProps) {
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
        title="انبار واحد"
        description="موجودی کالاهای واحد شما"
      />

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
                  {item.wareModel?.name || item.ware?.name || "—"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.quantity != null && (
                    <span className={cn(
                      "text-sm font-mono",
                      item.minQuantity != null && item.quantity < item.minQuantity
                        ? "text-destructive"
                        : "text-fog"
                    )} dir="ltr">
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
        emptyDescription="هنوز هیچ کالایی در انبار واحد شما ثبت نشده است."
      />

      <Pagination prevUrl={prevUrl} nextUrl={nextUrl} page={page} />
    </div>
  )
}

export { InventoryClient }
