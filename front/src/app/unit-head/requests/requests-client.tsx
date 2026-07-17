"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { RequestFilters } from "@/components/purchasing/request-filters"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"

interface PRItem {
  _id: string
  title?: string
  quantity?: number
  status?: string
  currentStep?: string
  createdAt?: string
  requester?: { _id: string; first_name?: string; last_name?: string }
  process?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
}

interface RequestsClientProps {
  items: PRItem[]
  prevUrl: string
  nextUrl: string
  page: number
  search?: string
  statusFilter?: string
}

function RequestsClient({ items, prevUrl, nextUrl, page, search = "", statusFilter = "" }: RequestsClientProps) {
  const router = useRouter()

  const handleSearch = useCallback((value: string) => {
    const params = new URLSearchParams()
    if (value.trim()) params.set("search", value.trim())
    if (statusFilter) params.set("status", statusFilter)
    router.push(`/unit-head/requests${params.toString() ? `?${params.toString()}` : ""}`)
  }, [router, statusFilter])

  const handleStatusFilter = useCallback((status: string) => {
    const params = new URLSearchParams()
    if (status) params.set("status", status)
    if (search) params.set("search", search)
    router.push(`/unit-head/requests${params.toString() ? `?${params.toString()}` : ""}`)
  }, [router, search])

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <RequestFilters
          search={search}
          onSearchChange={handleSearch}
          status={statusFilter}
          onStatusChange={handleStatusFilter}
        />
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState
              icon={ShoppingCart}
              title="درخواستی یافت نشد"
              description="هیچ درخواست خریدی برای این واحد وجود ندارد"
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <RequestFilters
        search={search}
        onSearchChange={handleSearch}
        status={statusFilter}
        onStatusChange={handleStatusFilter}
      />

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
                    {item.process?.name && (
                      <span className="text-xs text-fog/50 truncate">{item.process.name}</span>
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
    </div>
  )
}

export { RequestsClient }
