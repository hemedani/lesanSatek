"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Package,
  Boxes,
  AlertTriangle,
  Box,
  Building2,
  Warehouse,
  MapPin,
  Barcode,
  CalendarDays,
  ArrowDownUp,
  RotateCcw,
  Factory,
  FolderTree,
} from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { cn } from "@/lib/utils"

export interface InventoryItem {
  _id: string
  quantity?: number
  minQuantity?: number
  maxQuantity?: number
  batchNo?: string
  location?: string
  expirationDate?: string
  lastCountedAt?: string
  createdAt?: string
  unit?: { _id: string; name?: string; type?: string }
  warehouseUnit?: { _id: string; name?: string; type?: string }
  ware?: { _id: string; name?: string; enName?: string; brand?: string }
  wareModel?: { _id: string; name?: string; enName?: string }
  wareGroup?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
}

export interface InventoryCounts {
  total: number
  lowStock: number
  totalQuantity: number
}

interface InventoryClientProps {
  items: InventoryItem[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages?: number
  search: string
  sort: string
  counts: InventoryCounts
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "quantity-desc", label: "بیشترین موجودی" },
  { value: "quantity-asc", label: "کمترین موجودی" },
]

function InventoryCard({ item }: { item: InventoryItem }) {
  const lowStock = item.minQuantity != null && item.quantity != null && item.quantity < item.minQuantity
  const wareName = item.ware?.name || item.wareModel?.name || "کالای بدون نام"

  return (
    <div className="group block h-full rounded-2xl outline-none">
      <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/[0.08]",
                lowStock ? "bg-ember/10" : "bg-electric-iris/10",
              )}
            >
              <Box className={cn("size-5", lowStock ? "text-ember" : "text-electric-iris")} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-base font-semibold text-moonlight transition-colors group-hover:text-glacier">
                {wareName}
              </p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {item.ware?.brand && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/70">
                    <Factory className="size-3.5" />
                    {item.ware.brand}
                  </span>
                )}
                {item.wareModel?.name && item.wareModel.name !== wareName && (
                  <span className="inline-flex items-center gap-1 text-xs text-fog/60">
                    مدل: {item.wareModel.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          {lowStock && (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full bg-ember/10 px-2.5 py-0.5 text-[11px] font-medium text-ember border-ember/20"
            >
              کم‌موجودی
            </Badge>
          )}
        </div>

        <div
          className={cn(
            "grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]",
            lowStock && "bg-ember/10",
          )}
        >
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">موجودی</p>
            <p
              className={cn(
                "mt-1 text-lg font-bold tabular-nums leading-7",
                lowStock ? "text-ember" : "text-glacier",
              )}
              dir="ltr"
            >
              {item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "—"}
            </p>
          </div>
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">حداقل</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-fog leading-7" dir="ltr">
              {item.minQuantity != null ? item.minQuantity.toLocaleString("fa-IR") : "—"}
            </p>
          </div>
          <div className="bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">حداکثر</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-fog leading-7" dir="ltr">
              {item.maxQuantity != null ? item.maxQuantity.toLocaleString("fa-IR") : "—"}
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
          {item.warehouseUnit?.name && (
            <span className="inline-flex items-center gap-1.5">
              <Warehouse className="size-4 text-fog/60" />
              {item.warehouseUnit.name}
            </span>
          )}
          {item.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-fog/60" />
              {item.location}
            </span>
          )}
          {item.batchNo && (
            <span className="inline-flex items-center gap-1.5 font-mono" dir="ltr">
              <Barcode className="size-4 text-fog/60" />
              {item.batchNo}
            </span>
          )}
        </div>

        {(item.wareType?.name || item.wareClass?.name || item.wareGroup?.name) && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-steel-border/15 pt-3">
            <FolderTree className="size-3.5 text-fog/30 shrink-0" />
            {item.wareType?.name && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-frost-link/5 text-fog border-white/[0.06]">
                {item.wareType.name}
              </Badge>
            )}
            {item.wareClass?.name && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-frost-link/5 text-fog border-white/[0.06]">
                {item.wareClass.name}
              </Badge>
            )}
            {item.wareGroup?.name && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-frost-link/5 text-fog border-white/[0.06]">
                {item.wareGroup.name}
              </Badge>
            )}
            {item.createdAt && (
              <span className="inline-flex items-center gap-1.5 text-xs text-fog/60 ms-auto">
                <CalendarDays className="size-3.5 text-fog/40" />
                {new Date(item.createdAt).toLocaleDateString("fa-IR")}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InventoryClient({ items, prevUrl, nextUrl, page, totalPages, search, sort, counts }: InventoryClientProps) {
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
      router.push(`/orghead/inventory${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleReset = () => router.push("/orghead/inventory")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc"))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
        <StatCard
          label="کل اقلام موجودی"
          value={counts.total}
          icon={Package}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
          subtitle="اقلام ثبت‌شده در سازمان"
        />
        <StatCard
          label="کم‌موجودی"
          value={counts.lowStock}
          icon={AlertTriangle}
          iconColor="text-ember"
          iconBg="bg-ember/10"
          subtitle={counts.lowStock > 0 ? "نیازمند توجه" : undefined}
        />
        <StatCard
          label="مجموع موجودی"
          value={counts.totalQuantity}
          icon={Boxes}
          iconColor="text-glacier"
          iconBg="bg-frost-link/10"
          subtitle="جمع کل مقدار اقلام"
        />
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجو در کالاها…"
          ariaLabel="جستجو در موجودی انبار"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش موجودی"
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
            <InventoryCard key={item._id} item={item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Boxes}
          title={hasFilters ? "کالایی یافت نشد" : "موجودی‌ای ثبت نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا مرتب‌سازی، کالای موردنظر را پیدا کنید."
              : "هنوز هیچ موجودی در سازمان ثبت نشده است."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : undefined
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

export { InventoryClient }