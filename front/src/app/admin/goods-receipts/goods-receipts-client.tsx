"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ClipboardList, Pencil, Trash2, ArrowDownUp, RotateCcw, CalendarDays, ShoppingCart, Package } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove } from "@/app/actions/goodsReceipt/remove"

interface ReceiptItem {
  _id?: string
  wareModelName?: string
  wareName?: string
  quantityReceived?: number
  quantityAccepted?: number
  quantityRejected?: number
}

export interface GoodsReceipt {
  _id: string
  receiptNumber?: string
  description?: string
  status?: string
  receivedAt?: string
  notes?: string
  createdAt?: string
  items?: ReceiptItem[]
  purchasingRequest?: { _id: string; title?: string }
}

interface GoodsReceiptsClientProps {
  items: GoodsReceipt[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
  total: number
  search: string
  sort: string
  status: string
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "receiptNumber-asc", label: "شماره رسید" },
  { value: "receiptNumber-desc", label: "شماره رسید معکوس" },
  { value: "receivedAt-desc", label: "جدیدترین تاریخ رسید" },
  { value: "receivedAt-asc", label: "قدیمی‌ترین تاریخ رسید" },
]

const statusOptions: FilterOption[] = [
  { value: "pending", label: "در انتظار" },
  { value: "completed", label: "تکمیل شده" },
  { value: "partially_rejected", label: "رد جزئی" },
]

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function GoodsReceiptCard({
  item,
  onDelete,
}: {
  item: GoodsReceipt
  onDelete: (item: GoodsReceipt) => void
}) {
  const totalItems = item.items?.reduce((sum, it) => sum + (it.quantityReceived || 0), 0) || 0

  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <ClipboardList className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/goods-receipts/${item._id}`}
              className="block truncate font-mono text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
              title={item.receiptNumber}
            >
              {item.receiptNumber || "بدون شماره"}
            </Link>
            <StatusBadge status={item.status || "pending"} size="sm" />
          </div>
        </div>
      </div>

      {item.description && (
        <p className="line-clamp-2 text-body-sm leading-relaxed text-fog/70">{item.description}</p>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">اقلام کالا</p>
          <p className="mt-1 truncate text-sm font-medium leading-6 text-frost-link">
            {totalItems.toLocaleString("fa-IR")} عدد
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">تاریخ رسید</p>
          <p className="mt-1 truncate text-sm font-medium leading-6 text-moonlight">{faDate(item.receivedAt)}</p>
        </div>
      </div>

      <div className="mt-auto space-y-2 border-t border-steel-border/15 pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-body-sm text-fog/70">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <ShoppingCart className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{item.purchasingRequest?.title || "—"}</span>
          </span>
          {item.items?.[0]?.wareModelName && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Package className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{item.items[0].wareModelName}</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/60">
            <CalendarDays className="size-4 text-fog/60" />
            {faDate(item.createdAt)}
          </span>
          <div className="flex items-center gap-1">
            <Link href={`/admin/goods-receipts/${item._id}`} title="مشاهده و ویرایش">
              <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-moonlight">
                <Pencil className="size-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon-lg"
              className="size-9 text-fog/60 hover:text-ember hover:bg-ember/5"
              title="حذف"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GoodsReceiptsClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
  status,
}: GoodsReceiptsClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<GoodsReceipt | null>(null)
  const [deleting, setDeleting] = useState(false)

  const makeParams = useCallback(
    (next: { search?: string; sort?: string; status?: string }) => {
      const params = new URLSearchParams()
      const nextSearch = (next.search ?? search).trim()
      const nextSort = next.sort ?? sort
      const nextStatus = next.status ?? status
      if (nextSearch) params.set("search", nextSearch)
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort)
      if (nextStatus) params.set("status", nextStatus)
      return params.toString()
    },
    [search, sort, status],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`/admin/goods-receipts${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleStatus = (value: string | null) => go(makeParams({ status: value ?? "" }))
  const handleReset = () => router.push("/admin/goods-receipts")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc") || status)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await remove({ _id: deleteTarget._id })
      if (result.success) {
        toast.success("رسید کالا با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف رسید کالا")
      }
    } catch {
      toast.error("خطا در حذف رسید کالا")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="رسید کالا"
        description="مدیریت رسید کالاهای دریافت شده از فروشندگان"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} رسید کالا
        </span>
        <Link href="/admin/goods-receipts/new">
          <Button className="gap-2 px-5">
            <Plus className="size-5" />
            رسید جدید
          </Button>
        </Link>
        <HelpLauncher topicId="admin-goods-receipts" tooltip="راهنمای رسید کالا" />
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی شماره رسید…"
          ariaLabel="جستجوی رسید کالا"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ClipboardList}
            placeholder="وضعیت"
            ariaLabel="فیلتر بر اساس وضعیت"
            value={status}
            onValueChange={handleStatus}
            options={statusOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش رسیدها"
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
            <GoodsReceiptCard key={item._id} item={item} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={hasFilters ? "رسیدی یافت نشد" : "هنوز رسید کالایی ثبت نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا فیلترها، رسید موردنظر را پیدا کنید."
              : "برای ثبت کالای دریافتی از فروشنده، رسید کالا ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/goods-receipts/new">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد رسید کالا
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
          className="border-t border-steel-border/15 pt-2"
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="حذف رسید کالا"
        description={`آیا از حذف رسید «${deleteTarget?.receiptNumber || "این رسید"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}