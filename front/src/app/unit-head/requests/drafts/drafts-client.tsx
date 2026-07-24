"use client"

import Link from "next/link"
import { ShoppingCart, FileEdit } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

interface DraftItem {
  _id: string
  title?: string
  quantity?: number
  status?: string
  selectionType?: string
  createdAt?: string
  requester?: { _id: string; first_name?: string; last_name?: string }
  wareModel?: { _id: string; name?: string }
}

interface DraftsClientProps {
  items: DraftItem[]
  prevUrl: string
  nextUrl: string
  page: number
}

function DraftsClient({ items, prevUrl, nextUrl, page }: DraftsClientProps) {
  if (items.length === 0) {
    return (
      <Card variant="glass">
        <CardContent className="py-12">
          <EmptyState
            icon={FileEdit}
            title="پیش‌نویسی یافت نشد"
            description="هیچ درخواست خریدی در وضعیت پیش‌نویس برای واحد شما وجود ندارد"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <Link key={item._id} href={`/unit-head/requests/${item._id}`}>
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
                    {item.selectionType && item.selectionType !== "none" && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-sm font-medium",
                        item.selectionType === "stuff"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-violet-500/10 text-violet-400"
                      )}>
                        {item.selectionType === "stuff" ? "کالا" : "مناقصه"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-fog/50">
                {item.requester && (
                  <span>
                    {item.requester.first_name || ""} {item.requester.last_name || ""}
                  </span>
                )}
                {item.quantity != null && (
                  <span>{item.quantity.toLocaleString("fa-IR")} عدد</span>
                )}
                {item.wareModel?.name && (
                  <span>{item.wareModel.name}</span>
                )}
                {item.createdAt && (
                  <span className="ms-auto">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Pagination prevUrl={prevUrl} nextUrl={nextUrl} page={page} />
    </>
  )
}

export { DraftsClient }
