"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ScrollText,
  Boxes,
  Package,
  User,
  Building2,
  MessageSquareText,
  CalendarDays,
  ClipboardList,
  ArrowDownUp,
  RotateCcw,
} from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"

export interface ConsumptionRecord {
  _id: string
  quantity?: number
  notes?: string
  reason?: string
  consumedFor?: string
  consumedAt?: string
  createdAt?: string
  unit?: { _id: string; name?: string; type?: string }
  consumedBy?: { _id: string; first_name?: string; last_name?: string }
  inventory?: { _id: string; quantity?: number }
  ware?: { _id: string; name?: string; brand?: string }
  wareModel?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
}

export interface ConsumptionCounts {
  total: number
  totalQuantity: number
  averagePerRecord: number
}

interface ConsumptionClientProps {
  items: ConsumptionRecord[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages?: number
  search: string
  sort: string
  counts: ConsumptionCounts
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "quantity-desc", label: "بیشترین مصرف" },
  { value: "quantity-asc", label: "کمترین مصرف" },
]

function ConsumptionCard({ item }: { item: ConsumptionRecord }) {
  const wareName = item.ware?.name || item.wareModel?.name || "کالای بدون نام"
  const consumedByName = item.consumedBy
    ? [item.consumedBy.first_name, item.consumedBy.last_name].filter(Boolean).join(" ")
    : ""

  return (
    <Link
      href={`/requests/consumption/${item._id}`}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-inset ring-amber-500/15">
              <ScrollText className="size-5 text-amber-400" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                {wareName}
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {item.wareModel?.name && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">{item.wareModel.name}</span>
                )}
                {item.ware?.brand && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">{item.ware.brand}</span>
                )}
              </div>
            </div>
          </div>
          {item.wareType?.name && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-fog ring-1 ring-inset ring-steel-border/25">
              {item.wareType.name}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">مقدار مصرف</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-amber-400 leading-7" dir="ltr">
              {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
            </p>
          </div>
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">مصرف‌شونده</p>
            <p className="mt-1 truncate text-sm font-medium text-moonlight leading-7">
              {item.consumedFor || "—"}
            </p>
          </div>
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">تاریخ مصرف</p>
            <p className="mt-1 text-sm font-medium text-moonlight leading-7">
              {item.consumedAt ? new Date(item.consumedAt).toLocaleDateString("fa-IR") : "—"}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
          {item.unit?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="size-4 text-fog/60" />
              {item.unit.name}
            </span>
          )}
          {item.reason && (
            <span className="inline-flex items-center gap-1.5">
              <MessageSquareText className="size-4 text-fog/60" />
              {item.reason}
            </span>
          )}
          {consumedByName && (
            <span className="inline-flex items-center gap-1.5">
              <User className="size-4 text-fog/60" />
              {consumedByName}
            </span>
          )}
          {item.inventory?.quantity != null && (
            <span className="inline-flex items-center gap-1.5">
              <Package className="size-4 text-fog/60" />
              موجودی: {item.inventory.quantity.toLocaleString("fa-IR")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
          <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
            <CalendarDays className="size-4 text-fog/60" />
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
          </span>
          {item.notes && (
            <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-body-sm text-fog/70">
              <ClipboardList className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{item.notes}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function ConsumptionClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  search,
  sort,
  counts,
}: ConsumptionClientProps) {
  const router = useRouter()

  const makeParams = useCallback(
    (next: { search?: string; sort?: string }) => {
      const params = new URLSearchParams()
      const nextSearch = (next.search ?? search).trim()
      const nextSort = next.sort ?? sort
      if (nextSearch) params.set("search", nextSearch)
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort)
      return params.toString()
    },
    [search, sort],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`/requests/consumption${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleReset = () => router.push("/requests/consumption")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc"))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
        <StatCard
          label="کل رکوردهای مصرف"
          value={counts.total}
          icon={ScrollText}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
        />
        <StatCard
          label="مجموع مصرف"
          value={counts.totalQuantity}
          icon={Boxes}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
        />
        <StatCard
          label="میانگین هر رکورد"
          value={counts.averagePerRecord}
          icon={Package}
          iconColor="text-glacier"
          iconBg="bg-frost-link/10"
        />
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجو در نام مصرف‌شونده…"
          ariaLabel="جستجو در مصرف کالا"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش مصرف‌ها"
            value={sort}
            onValueChange={handleSort}
            options={sortOptions}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-11 gap-2 rounded-sm px-4 text-body-sm text-moonlight"
            >
              <RotateCcw className="size-5" strokeWidth={2} />
              پاک کردن فیلترها
            </Button>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <ConsumptionCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ScrollText}
          title={hasFilters ? "مصرفی یافت نشد" : "هنوز مصرفی ثبت نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا مرتب‌سازی، رکورد موردنظر را پیدا کنید."
              : "از صفحه موجودی انبار می‌توانید برای کالاها، مصرف ثبت کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/requests/inventory">
                <Button variant="ghost" className="gap-2 px-4">
                  رفتن به موجودی انبار
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

export { ConsumptionClient }
