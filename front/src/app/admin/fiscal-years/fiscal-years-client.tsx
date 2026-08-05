"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, CalendarRange, Pencil, Trash2, ArrowDownUp, RotateCcw, Lock, CalendarDays, Share2 } from "lucide-react"
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
import { remove } from "@/app/actions/fiscalYear/remove"
import { close } from "@/app/actions/fiscalYear/close"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface FiscalYear {
  _id: string
  name?: string
  status?: string
  isActive?: boolean
  startDate?: string
  endDate?: string
  createdAt?: string
  organization?: { _id: string; name?: string }
  budgetLines?: { _id: string }[]
}

interface FiscalYearsClientProps {
  items: FiscalYear[]
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
  { value: "name-asc", label: "نام" },
  { value: "name-desc", label: "نام معکوس" },
]

const statusOptions: FilterOption[] = [
  { value: "open", label: "باز" },
  { value: "closed", label: "بسته" },
]

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function FiscalYearCard({
  item,
  onClose,
  onDelete,
}: {
  item: FiscalYear
  onClose: (item: FiscalYear) => void
  onDelete: (item: FiscalYear) => void
}) {
  const period = [item.startDate, item.endDate].some(Boolean)
    ? `${faDate(item.startDate)} — ${faDate(item.endDate)}`
    : "—"

  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <CalendarRange className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/fiscal-years/${item._id}`}
              className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
            >
              {item.name || "بدون نام"}
            </Link>
            {item.isActive && (
              <p className="flex items-center gap-1 text-xs text-frost-link">
                <span className="size-1.5 rounded-full bg-cipher-mint" aria-hidden="true" />
                سال مالی فعال
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={item.status === "closed" ? "closed" : "open"} size="sm" />
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">سازمان</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6" title={item.organization?.name}>
            {item.organization?.name || "—"}
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">بازه زمانی</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6" title={period}>
            {period}
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">ردیف‌های بودجه</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">
            {(item.budgetLines?.length || 0).toLocaleString("fa-IR")}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
          <CalendarDays className="size-4 text-fog/60" />
          {faDate(item.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Link href={`/admin/fiscal-years/${item._id}`} title="ویرایش">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-moonlight">
              <Pencil className="size-5" />
            </Button>
          </Link>
          <Link href={`/admin/fiscal-years/${item._id}/relations`} title="ویرایش روابط">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-electric-iris">
              <Share2 className="size-5" />
            </Button>
          </Link>
          {item.status !== "closed" && (
            <Button
              variant="ghost"
              size="icon-lg"
              className="size-9 text-fog/60 hover:text-amber-400"
              title="بستن سال مالی"
              onClick={() => onClose(item)}
            >
              <Lock className="size-5" />
            </Button>
          )}
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
  )
}

export function FiscalYearsClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
  status,
}: FiscalYearsClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<FiscalYear | null>(null)
  const [closeTarget, setCloseTarget] = useState<FiscalYear | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [closing, setClosing] = useState(false)

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
      router.push(`/admin/fiscal-years${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleStatus = (value: string | null) => go(makeParams({ status: value ?? "" }))
  const handleReset = () => router.push("/admin/fiscal-years")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc") || status)

  const handleClose = async () => {
    if (!closeTarget) return
    setClosing(true)
    try {
      const result = await close({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: closeTarget._id,
      })
      if (result.success) {
        toast.success("سال مالی با موفقیت بسته شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در بستن سال مالی")
      }
    } catch {
      toast.error("خطا در بستن سال مالی")
    } finally {
      setClosing(false)
      setCloseTarget(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await remove({
        _id: deleteTarget._id,
      })
      if (result.success) {
        toast.success("سال مالی با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف سال مالی")
      }
    } catch {
      toast.error("خطا در حذف سال مالی")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="سال‌های مالی"
        description="مدیریت دوره‌های مالی سازمان و وضعیت باز یا بسته بودن آن‌ها"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} سال مالی
        </span>
        <Link href="/admin/fiscal-years/add">
          <Button className="gap-2 px-5">
            <Plus className="size-5" />
            افزودن سال مالی
          </Button>
        </Link>
        <HelpLauncher topicId="admin-fiscal-years" tooltip="راهنمای سال‌های مالی" />
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی سال مالی…"
          ariaLabel="جستجوی سال مالی"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={Lock}
            placeholder="وضعیت"
            ariaLabel="فیلتر بر اساس وضعیت"
            value={status}
            onValueChange={handleStatus}
            options={statusOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش سال‌های مالی"
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
            <FiscalYearCard
              key={item._id}
              item={item}
              onClose={setCloseTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarRange}
          title={hasFilters ? "سال مالی یافت نشد" : "هنوز سال مالی تعریف نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا فیلترها، سال مالی موردنظر را پیدا کنید."
              : "نخستین سال مالی را برای شروع مدیریت بودجه ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/fiscal-years/add">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد سال مالی
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
        open={!!closeTarget}
        onOpenChange={(open) => { if (!open) setCloseTarget(null) }}
        title="بستن سال مالی"
        description={`آیا از بستن سال مالی «${closeTarget?.name || "این سال مالی"}» اطمینان دارید؟ پس از بستن، عملیات بودجه‌ای بیشتر متوقف می‌شود.`}
        confirmLabel="بستن"
        onConfirm={handleClose}
        loading={closing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="حذف سال مالی"
        description={`آیا از حذف سال مالی «${deleteTarget?.name || "این سال مالی"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
