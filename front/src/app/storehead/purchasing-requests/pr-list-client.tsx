"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { Pagination } from "@/components/ui/pagination"

interface PRItem {
  _id: string
  title?: string
  status?: string
  quantity?: number
  estimatedAmount?: number
  createdAt?: string
}

interface PRListClientProps {
  items: PRItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
}

export function PRListClient({ items, prevPageUrl, nextPageUrl, page }: PRListClientProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <Link key={item._id} href={`/storehead/purchasing-requests/${item._id}`}>
            <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 cursor-pointer h-full">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingCart className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.title || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <RequestStatusBadge status={item.status} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-fog/50">
                {item.quantity != null && (
                  <span>{item.quantity.toLocaleString("fa-IR")} عدد</span>
                )}
                {item.estimatedAmount != null && (
                  <span>{item.estimatedAmount.toLocaleString("fa-IR")} ریال</span>
                )}
                {item.createdAt && (
                  <span className="ms-auto">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </>
  )
}
