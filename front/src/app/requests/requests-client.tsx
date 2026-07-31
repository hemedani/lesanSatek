"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ShoppingCart,
  User,
  Boxes,
  Package,
  Coins,
  CalendarDays,
  GitBranch,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { RequestsFilterBar } from "./requests-filter-bar"
import type { FilterOption } from "@/components/ui/filter-select"
import { cn } from "@/lib/utils"

export interface PRItem {
  _id: string
  title?: string
  status?: string
  currentStep?: number
  quantity?: number
  estimatedAmount?: number
  createdAt?: string
  requester?: { _id?: string; first_name?: string; last_name?: string }
  process?: { _id?: string; name?: string; unit?: { _id?: string; name?: string } }
  wareModel?: { _id?: string; name?: string }
}

export interface ProcessOption {
  _id: string
  name?: string
  status?: string
}

interface RequestsListClientProps {
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
}

function RequestsListClient({
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
}: RequestsListClientProps) {
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
      router.push(`/requests${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleStatus = (value: string | null) => go(makeParams({ status: value ?? "" }))
  const handleProcess = (value: string | null) => go(makeParams({ processId: value ?? "" }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value === "asc" ? "asc" : "desc" }))
  const handleReset = () => router.push("/requests")

  const hasFilters = Boolean(search || status || processId || sort === "asc")
  const processOptions: FilterOption[] = processes.map((p) => ({
    value: p._id,
    label: p.name || "بدون نام",
  }))

  return (
    <div className="space-y-6">
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
            <RequestListItem key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title="درخواستی یافت نشد"
          description={
            hasFilters
              ? "با تغییر فیلترها یا پاک کردن جستجو، درخواست موردنظر را پیدا کنید."
              : "هنوز هیچ درخواست خریدی ثبت نشده است."
          }
          action={
            <Link href="/requests/new">
              <Button className="gap-1.5">
                <ShoppingCart className="size-4" />
                ثبت درخواست جدید
              </Button>
            </Link>
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

function RequestListItem({ item }: { item: PRItem }) {
  const requesterName = item.requester
    ? [item.requester.first_name, item.requester.last_name].filter(Boolean).join(" ")
    : ""

  return (
    <Link
      href={`/requests/${item._id}`}
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
                {item.process?.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                    <GitBranch className="size-3.5" />
                    {item.process.name}
                  </span>
                )}
                {typeof item.currentStep === "number" && item.currentStep > 0 && (
                  <span className="inline-flex items-center rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-pebble ring-1 ring-inset ring-steel-border/25">
                    گام {item.currentStep.toLocaleString("fa-IR")}
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
          {item.process?.unit?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4 text-fog/60" />
              {item.process.unit.name}
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
          {item.estimatedAmount != null && (
            <span className="inline-flex items-center gap-1.5 text-pebble">
              <Coins className="size-4 text-fog/60" />
              {item.estimatedAmount.toLocaleString("fa-IR")} ریال
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
}

export { RequestsListClient }
