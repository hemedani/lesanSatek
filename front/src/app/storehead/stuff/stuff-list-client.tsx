"use client"

import Link from "next/link"
import { Package, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"

interface StuffItem {
  _id: string
  quantity?: number
  price?: number
  expiration?: string
  barcode?: number
  createdAt?: string
  ware?: { _id?: string; name?: string }
}

interface StuffListClientProps {
  items: StuffItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
  search: string
}

export function StuffListClient({ items, prevPageUrl, nextPageUrl, page, search }: StuffListClientProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item._id} className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 h-full">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="size-10 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Package className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-moonlight leading-6 truncate">
                    {item.ware?.name || "—"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.quantity != null && (
                      <span className="text-sm font-mono text-fog" dir="ltr">
                        {item.quantity.toLocaleString("fa-IR")} عدد
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Link href={`/storehead/stuff/${item._id}`}>
                <Button variant="ghost" size="icon-xs" className="shrink-0">
                  <Pencil className="size-3.5" />
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-fog/50">
              {item.price != null && (
                <span>{item.price.toLocaleString("fa-IR")} ریال</span>
              )}
              {item.expiration && (
                <span>انقضا: {new Date(item.expiration).toLocaleDateString("fa-IR")}</span>
              )}
              {item.createdAt && (
                <span className="ms-auto">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
    </>
  )
}
