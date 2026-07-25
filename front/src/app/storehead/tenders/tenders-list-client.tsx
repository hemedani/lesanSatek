"use client"

import Link from "next/link"
import { Gavel } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Pagination } from "@/components/ui/pagination"

const tenderStatusMap: Record<string, string> = {
  open: "باز",
  closed: "بسته شده",
  awarded: "اعطا شده",
  cancelled: "لغو شده",
}

interface TenderItem {
  _id: string
  title?: string
  deadline?: string
  status?: string
  purchasingRequest?: { _id: string; title?: string }
}

interface TendersListClientProps {
  items: TenderItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
}

export function TendersListClient({ items, prevPageUrl, nextPageUrl, page }: TendersListClientProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div key={item._id} className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 h-full">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Gavel className="size-5 text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-moonlight leading-6 truncate">
                  {item.title || "—"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={item.status || "open"} label={tenderStatusMap[item.status || "open"]} />
                  {item.purchasingRequest?.title && (
                    <span className="text-xs text-fog/50 truncate">{item.purchasingRequest.title}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-fog/50">
              {item.deadline && (
                <span>مهلت: {new Date(item.deadline).toLocaleDateString("fa-IR")}</span>
              )}
              <span className="ms-auto">
                {item.status === "open" ? (
                  <Link href={`/storehead/tenders/${item._id}/offer`}>
                    <Button variant="outline" size="sm">ثبت پیشنهاد</Button>
                  </Link>
                ) : (
                  <span className="text-fog/40">—</span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </>
  )
}
