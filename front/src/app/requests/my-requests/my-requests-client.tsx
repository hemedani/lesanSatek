"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

const statusMap: Record<string, string> = {
  Draft: "پیش‌نویس",
  draft: "پیش‌نویس",
  Pending: "در انتظار تایید",
  pending: "در انتظار تایید",
  Approved: "تایید شده",
  approved: "تایید شده",
  Rejected: "رد شده",
  rejected: "رد شده",
  InProgress: "در حال انجام",
  in_progress: "در حال انجام",
  Completed: "تکمیل شده",
  completed: "تکمیل شده",
}

interface PRItem {
  _id: string
  title?: string
  quantity?: number
  status?: string
  currentStep?: string
  createdAt?: string
}

interface MyRequestsClientProps {
  items: PRItem[]
  prevUrl: string
  nextUrl: string
  page: number
  tab?: string
}

function MyRequestsClient({ items, prevUrl, nextUrl, page, tab }: MyRequestsClientProps) {
  if (items.length === 0) {
    return (
      <Card variant="glass">
        <CardContent className="py-12">
          <EmptyState
            icon={ShoppingCart}
            title={tab === "receipt" ? "کالایی برای تحویل نیست" : "درخواستی یافت نشد"}
            description={tab === "receipt" ? "همه کالاهای شما تحویل داده شده‌اند" : "شما هنوز هیچ درخواست خریدی ثبت نکرده‌اید"}
            action={
              tab === "receipt" ? (
                <Link href="/requests/my-requests">
                  <Button variant="outline">مشاهده همه درخواست‌ها</Button>
                </Link>
              ) : (
                <Link href="/requests/new">
                  <Button variant="default">ثبت درخواست جدید</Button>
                </Link>
              )
            }
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <Link key={item._id} href={`/requests/${item._id}`}>
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
                    <StatusBadge status={item.status || "draft"} labelMap={statusMap} />
                    {item.currentStep && (
                      <span className="text-xs text-fog/50 truncate">مرحله {item.currentStep}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-fog/50">
                {item.quantity != null && (
                  <span>{item.quantity.toLocaleString("fa-IR")} عدد</span>
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

export { MyRequestsClient }
