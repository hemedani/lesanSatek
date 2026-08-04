"use client"

import Link from "next/link"
import { FileEdit, User, Boxes, Package, CalendarDays, ShoppingCart } from "lucide-react"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

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
  totalPages?: number
}

function DraftsClient({ items, prevUrl, nextUrl, page, totalPages }: DraftsClientProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileEdit}
        title="پیش‌نویسی یافت نشد"
        description="هیچ درخواست خریدی در وضعیت پیش‌نویس برای واحد شما وجود ندارد"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
        {items.map((item) => {
          const requesterName = item.requester
            ? [item.requester.first_name, item.requester.last_name].filter(Boolean).join(" ")
            : ""
          return (
            <Link
              key={item._id}
              href={`/unit-head/requests/${item._id}`}
              className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20">
                      <ShoppingCart className="size-5 text-electric-iris" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                        {item.title || "درخواست خرید"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        {item.selectionType && item.selectionType !== "none" && (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                              item.selectionType === "stuff"
                                ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                                : "bg-violet-500/10 text-violet-400 ring-violet-500/20",
                            )}
                          >
                            {item.selectionType === "stuff" ? "تخصیص کالا" : "مناقصه"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <RequestStatusBadge status={item.status} />
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
                  {requesterName && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="size-4 text-fog/60" />
                      {requesterName}
                    </span>
                  )}
                  {item.wareModel?.name && (
                    <span className="inline-flex items-center gap-1.5">
                      <Boxes className="size-4 text-fog/60" />
                      {item.wareModel.name}
                    </span>
                  )}
                  {item.quantity != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <Package className="size-4 text-fog/60" />
                      {item.quantity.toLocaleString("fa-IR")} عدد
                    </span>
                  )}
                  {item.createdAt && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        requesterName && "ms-auto",
                      )}
                    >
                      <CalendarDays className="size-4 text-fog/60" />
                      {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

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

export { DraftsClient }