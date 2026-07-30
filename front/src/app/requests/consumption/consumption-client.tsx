"use client"

import Link from "next/link"
import { ScrollText, ArrowRight } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import type { Column } from "@/components/ui/data-table"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"

interface ConsumptionRecord {
  _id: string
  quantity?: number
  notes?: string
  reason?: string
  consumedAt?: string
  createdAt?: string
  unit?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
  ware?: { _id: string; name?: string }
  consumedBy?: { _id: string; first_name?: string }
}

interface ConsumptionClientProps {
  items: ConsumptionRecord[]
  prevPageUrl?: string
  nextPageUrl?: string
  page?: number
}

const columns: Column<ConsumptionRecord>[] = [
  {
    key: "ware",
    label: "کالا",
    render: (item) => (
      <Link href={`/requests/consumption/${item._id}`} className="flex items-center gap-3 group">
        <div className="size-8 rounded-lg bg-electric-iris/10 flex items-center justify-center shrink-0">
          <ScrollText className="size-4 text-electric-iris" />
        </div>
        <span className="text-moonlight font-medium group-hover:text-frost-link transition-colors">{item.ware?.name || item.wareModel?.name || "—"}</span>
      </Link>
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
    key: "notes",
    label: "توضیحات",
    render: (item) => (
      <span className="text-fog text-sm max-w-[200px] truncate">{item.notes || "—"}</span>
    ),
  },
  {
    key: "consumedAt",
    label: "تاریخ مصرف",
    render: (item) => (
      <span className="text-fog text-sm">
        {item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}
      </span>
    ),
    hideOnCard: true,
  },
  {
    key: "createdAt",
    label: "تاریخ ثبت",
    render: (item) => (
      <span className="text-fog text-sm">
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
      </span>
    ),
    hideOnCard: true,
  },
]

function ConsumptionClient({ items, prevPageUrl, nextPageUrl, page }: ConsumptionClientProps) {
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
        title="مصرف کالا"
        description="ثبت و مشاهده مصرف کالا"
      />

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={true}
        renderCard={(item) => (
          <Link href={`/requests/consumption/${item._id}`} className="block">
            <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                  <ScrollText className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.ware?.name || item.wareModel?.name || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
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
          </Link>
        )}
        emptyTitle="مصرفی ثبت نشده"
        emptyDescription="هنوز هیچ مصرف کالایی ثبت نشده است."
      />

      <Pagination
        page={page || 1}
        prevUrl={prevPageUrl || ""}
        nextUrl={nextPageUrl || ""}
      />
    </div>
  )
}

export { ConsumptionClient }
