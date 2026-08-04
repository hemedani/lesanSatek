"use client"

import Link from "next/link"
import { Clock, User, Package, CalendarDays, GitBranch } from "lucide-react"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"

interface PendingPRItem {
  _id: string
  title?: string
  quantity?: number
  status?: string
  currentStep?: number
  createdAt?: string
  requester?: { _id?: string; first_name?: string; last_name?: string }
  process?: {
    _id?: string
    name?: string
    steps?: {
      _id?: string
      name?: string
      order?: number
      stepType?: string
    }[]
  }
}

interface PendingClientProps {
  items: PendingPRItem[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages?: number
}

function currentStepName(item: PendingPRItem): string | undefined {
  const idx = item.currentStep ?? 0
  const step = item.process?.steps?.find((s) => s.order === idx) || item.process?.steps?.[idx]
  return step?.name
}

function PendingClient({ items, prevUrl, nextUrl, page, totalPages }: PendingClientProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="درخواستی برای تایید وجود ندارد"
        description="همه درخواست‌های خرید واحد شما بررسی شده‌اند"
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
          const stepName = currentStepName(item)
          return (
            <Link
              key={item._id}
              href={`/unit-head/requests/${item._id}`}
              className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-inset ring-amber-400/20">
                      <Clock className="size-5 text-amber-400" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                        {item.title || "درخواست خرید"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        {item.process?.name && (
                          <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                            <GitBranch className="size-3.5" />
                            {item.process.name}
                          </span>
                        )}
                        {stepName && (
                          <span className="inline-flex items-center rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-pebble ring-1 ring-inset ring-steel-border/25">
                            {stepName}
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

export { PendingClient }