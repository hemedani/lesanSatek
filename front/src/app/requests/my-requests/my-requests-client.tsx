"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShoppingCart, FileEdit, Clock, CheckCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { RequestsFilterBar } from "../requests-filter-bar"
import { RequestListItem } from "../requests-client"
import type { PRItem, ProcessOption } from "../requests-client"
import type { FilterOption } from "@/components/ui/filter-select"

export interface MyRequestCounts {
  total: number
  draft: number
  pending: number
  approved: number
}

interface MyRequestsClientProps {
  items: PRItem[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages?: number
  search: string
  status: string
  processId: string
  sort: "asc" | "desc"
  processes: ProcessOption[]
  counts: MyRequestCounts
}

function MyRequestsClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  search,
  status,
  processId,
  sort,
  processes,
  counts,
}: MyRequestsClientProps) {
  const router = useRouter()

  const makeParams = useCallback(
    (next: { search?: string; status?: string; processId?: string; sort?: string }) => {
      const params = new URLSearchParams()
      const nextSearch = (next.search ?? search).trim()
      const nextStatus = next.status ?? status
      const nextProcessId = next.processId ?? processId
      const nextSort = next.sort ?? sort
      if (nextSearch) params.set("search", nextSearch)
      if (nextStatus) params.set("status", nextStatus)
      if (nextProcessId) params.set("processId", nextProcessId)
      if (nextSort === "asc") params.set("sort", "asc")
      return params.toString()
    },
    [search, status, processId, sort],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`/requests/my-requests${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleStatus = (value: string | null) => go(makeParams({ status: value ?? "" }))
  const handleProcess = (value: string | null) => go(makeParams({ processId: value ?? "" }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value === "asc" ? "asc" : "desc" }))
  const handleReset = () => router.push("/requests/my-requests")

  const hasFilters = Boolean(search || status || processId || sort === "asc")
  const processOptions: FilterOption[] = processes.map((p) => ({
    value: p._id,
    label: p.name || "بدون نام",
  }))

  const statItems = [
    {
      key: "all",
      label: "کل درخواست‌ها",
      value: counts.total,
      icon: ShoppingCart,
      iconColor: "text-electric-iris",
      iconBg: "bg-electric-iris/10",
      status: "",
    },
    {
      key: "draft",
      label: "پیش‌نویس",
      value: counts.draft,
      icon: FileEdit,
      iconColor: "text-fog",
      iconBg: "bg-white/[0.03]",
      status: "Draft",
    },
    {
      key: "pending",
      label: "در انتظار / در جریان",
      value: counts.pending,
      icon: Clock,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-400/10",
      status: "Pending",
    },
    {
      key: "approved",
      label: "تایید شده",
      value: counts.approved,
      icon: CheckCircle,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-400/10",
      status: "Approved",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {statItems.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.iconColor}
            iconBg={stat.iconBg}
            active={status === stat.status}
            onClick={() => go(makeParams({ status: stat.status }))}
          />
        ))}
      </div>

      <RequestsFilterBar
        search={search}
        onSearchChange={handleSearch}
        status={status}
        onStatusChange={handleStatus}
        processId={processId}
        onProcessChange={handleProcess}
        processOptions={processOptions}
        sort={sort}
        onSortChange={handleSort}
        onReset={handleReset}
        hasActiveFilters={hasFilters}
      />

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <RequestListItem key={item._id} item={item} hideRequester />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title={hasFilters ? "درخواستی یافت نشد" : "هنوز درخواستی ثبت نکرده‌اید"}
          description={
            hasFilters
              ? "با تغییر فیلترها یا پاک کردن جستجو، درخواست موردنظر را پیدا کنید."
              : "اولین درخواست خرید خود را همین حالا ثبت کنید و روند تأیید را دنبال کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/requests/new">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ثبت درخواست جدید
                </Button>
              </Link>
            )
          }
        />
      )}

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

export { MyRequestsClient }
