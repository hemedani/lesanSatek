"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Package,
  ShoppingCart,
  Building2,
  DollarSign,
  Loader2,
  Boxes,
  Coins,
  ArrowDownUp,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import type { FilterOption } from "@/components/ui/filter-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import { receiveGoods } from "@/app/actions/purchasingRequest/receiveGoods"

interface PRItem {
  _id: string
  title?: string
  quantity?: number
  estimatedAmount?: number
  status?: string
  stuffStatus?: string
  requestingUnit?: { _id?: string; name?: string }
  wareModel?: { _id?: string; name?: string }
  organization?: { _id?: string; name?: string }
}

interface GoodsReceiptClientProps {
  items: PRItem[]
  warehouseUnitId: string
  currentUserId: string
  warehouseName?: string
}

const sortOptions: FilterOption[] = [
  { value: "created-desc", label: "جدیدترین" },
  { value: "created-asc", label: "قدیمی‌ترین" },
  { value: "quantity-desc", label: "بیشترین تعداد" },
  { value: "quantity-asc", label: "کمترین تعداد" },
]

type SortKey = "created-desc" | "created-asc" | "quantity-desc" | "quantity-asc"

function isSortKey(value: string): value is SortKey {
  return sortOptions.some((o) => o.value === value)
}

function matchesSearch(item: PRItem, q: string): boolean {
  if (!q) return true
  const haystack = [
    item.title,
    item.requestingUnit?.name,
    item.organization?.name,
    item.wareModel?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(q.toLowerCase())
}

function GoodsReceiptClient({ items, warehouseUnitId, currentUserId, warehouseName }: GoodsReceiptClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortKey>("created-desc")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<PRItem | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim()
    const list = items.filter((i) => matchesSearch(i, q))
    const sortAsc = sort.endsWith("-asc")
    let sorted = list
    if (sort.startsWith("created")) {
      sorted = [...list].reverse()
    } else {
      sorted = [...list].sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))
    }
    return sortAsc ? sorted : sorted.reverse()
  }, [items, search, sort])

  const totalQuantity = useMemo(() => items.reduce((s, i) => s + (i.quantity ?? 0), 0), [items])
  const totalAmount = useMemo(() => items.reduce((s, i) => s + (i.estimatedAmount ?? 0), 0), [items])

  const hasFilters = Boolean(search.trim() || sort !== "created-desc")
  const handleReset = () => {
    setSearch("")
    setSort("created-desc")
  }

  const handleReceive = async (item: PRItem) => {
    if (!item.wareModel?._id) {
      toast.error("این درخواست مدل کالا ندارد")
      return
    }
    setLoadingId(item._id)
    setConfirmTarget(null)
    try {
      const result = await receiveGoods({
        purchasingRequestId: item._id,
        wareModelId: item.wareModel._id,
        quantity: item.quantity || 1,
        receivingUnitId: warehouseUnitId,
        receivedById: currentUserId,
      })
      if (result.success) {
        toast.success(`کالای "${item.title || "بدون عنوان"}" با موفقیت دریافت شد`)
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در دریافت کالا")
      }
    } catch {
      toast.error("خطا در دریافت کالا")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
        <StatCard
          label="کالاهای در انتظار تحویل"
          value={items.length}
          icon={Boxes}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
        />
        <StatCard
          label="مجموع تعداد"
          value={totalQuantity}
          icon={Package}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
        />
        <StatCard
          label="مجموع مبلغ"
          value={`${totalAmount.toLocaleString("fa-IR")} ریال`}
          icon={Coins}
          iconColor="text-frost-link"
          iconBg="bg-frost-link/10"
        />
      </div>

      {/* 2. Filter bar */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="جستجو در عنوان، واحد و سازمان…"
          ariaLabel="جستجو در درخواست‌های آماده تحویل"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش کالاهای تحویل"
            value={sort}
            onValueChange={(v) => setSort(isSortKey(v || "") ? v as SortKey : "created-desc")}
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

      {/* 3. Rich cards */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl py-12">
          <EmptyState
            icon={Package}
            title={hasFilters ? "کالایی یافت نشد" : "کالایی برای تحویل نیست"}
            description={
              hasFilters
                ? "با تغییر جستجو یا مرتب‌سازی، درخواست موردنظر را پیدا کنید."
                : "همه کالاهای آماده ارسال تحویل داده شده‌اند"
            }
            action={
              hasFilters ? (
                <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                  پاک کردن فیلترها
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="glass-card glass-card-hover-active rounded-2xl p-5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="size-11 shrink-0 rounded-xl bg-emerald-500/10 flex items-center justify-center mt-0.5 ring-1 ring-inset ring-emerald-500/15">
                    <Package className="size-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/unit-head/requests/${item._id}`}
                      className="inline-block text-base font-semibold text-moonlight leading-6 truncate transition-colors hover:text-glacier"
                    >
                      {item.title || "—"}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {item.organization?.name && (
                        <span className="text-xs text-fog/50 truncate flex items-center gap-1">
                          <Building2 className="size-3 shrink-0" />
                          {item.organization.name}
                        </span>
                      )}
                      {item.requestingUnit?.name && (
                        <span className="text-xs text-fog/50 truncate flex items-center gap-1">
                          <ShoppingCart className="size-3 shrink-0" />
                          {item.requestingUnit.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  disabled={loadingId === item._id}
                  onClick={() => setConfirmTarget(item)}
                >
                  {loadingId === item._id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Package className="size-4" />
                  )}
                  {loadingId === item._id ? "در حال دریافت..." : "دریافت کالا"}
                </Button>
              </div>
              <div className="flex items-center gap-x-5 gap-y-2 mt-3 text-xs text-fog/60 flex-wrap border-t border-steel-border/15 pt-3">
                {item.quantity != null && (
                  <span className="flex items-center gap-1.5" dir="ltr">
                    <ShoppingCart className="size-3.5 text-fog/40" />
                    {item.quantity.toLocaleString("fa-IR")} عدد
                  </span>
                )}
                {item.estimatedAmount != null && (
                  <span className="flex items-center gap-1.5" dir="ltr">
                    <DollarSign className="size-3.5 text-fog/40" />
                    {item.estimatedAmount.toLocaleString("fa-IR")} ریال
                  </span>
                )}
                {item.wareModel?.name && (
                  <span className="flex items-center gap-1.5">
                    <Package className="size-3.5 text-fog/40" />
                    {item.wareModel.name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}
        title="تأیید دریافت کالا"
        description={
          confirmTarget
            ? `آیا از دریافت "${confirmTarget.title || "بدون عنوان"}" در ${warehouseName || "انبار"} اطمینان دارید؟`
            : ""
        }
        confirmLabel="تأیید دریافت"
        onConfirm={() => confirmTarget && handleReceive(confirmTarget)}
        loading={loadingId === confirmTarget?._id}
      />
    </div>
  )
}

export { GoodsReceiptClient }