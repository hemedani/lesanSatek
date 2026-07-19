"use client"

import Link from "next/link"
import { Clock, ShoppingCart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

interface PendingApprovalItem {
  _id: string
  status?: string
  comment?: string
  createdAt?: string
  purchasingRequest?: {
    _id: string
    title?: string
    status?: string
    quantity?: number
    currentStep?: number
    requester?: { _id: string; first_name?: string; last_name?: string }
  }
  processStep?: {
    _id: string
    name?: string
    order?: number
  }
}

interface PendingClientProps {
  items: PendingApprovalItem[]
  prevUrl: string
  nextUrl: string
  page: number
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
          const pr = item.purchasingRequest
          const step = item.processStep
          return (
            <Link key={item._id} href={`/unit-head/requests/${pr?._id || ""}`}>
              <div className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="size-5 text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-moonlight leading-6 truncate">
                      {pr?.title || "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {pr?.status && <RequestStatusBadge status={pr.status} />}
                      {step?.name && (
                        <span className="text-xs text-fog/50 truncate">{step.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-fog/50">
                  {pr?.requester && (
                    <span>
                      {pr.requester.first_name || ""} {pr.requester.last_name || ""}
                    </span>
                  )}
                  {pr?.quantity != null && (
                    <span>{pr.quantity.toLocaleString("fa-IR")} عدد</span>
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
