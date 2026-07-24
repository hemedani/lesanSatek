"use client"

import Link from "next/link"
import { Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

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
}

function currentStepName(item: PendingPRItem): string | undefined {
  const idx = item.currentStep ?? 0
  const step = item.process?.steps?.find((s) => s.order === idx) || item.process?.steps?.[idx]
  return step?.name
}

function PendingClient({ items, prevUrl, nextUrl, page }: PendingClientProps) {
  if (items.length === 0) {
    return (
      <Card variant="glass">
        <CardContent className="py-12">
          <EmptyState
            icon={Clock}
            title="درخواستی برای تایید وجود ندارد"
            description="همه درخواست‌های خرید واحد شما بررسی شده‌اند"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => {
          const stepName = currentStepName(item)
          return (
            <Link key={item._id} href={`/unit-head/requests/${item._id}`}>
              <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="size-5 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-moonlight leading-6 truncate">
                      {item.title || "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.status && <RequestStatusBadge status={item.status} />}
                      {stepName && (
                        <span className="text-xs text-fog/50 truncate">{stepName}</span>
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
                  {item.createdAt && (
                    <span className="ms-auto">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <Pagination prevUrl={prevUrl} nextUrl={nextUrl} page={page} />
    </>
  )
}

export { PendingClient }
