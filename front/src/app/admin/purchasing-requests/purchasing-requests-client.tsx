"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ShoppingCart, Pencil, Trash2, ArrowDownUp, RotateCcw, CalendarDays, Building2, UserRound, Workflow, Package } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { FilterOption } from "@/components/ui/filter-select"
import { RequestStatusBadge } from "@/components/purchasing/request-status-badge"
import { cn } from "@/lib/utils"
import { remove } from "@/app/actions/purchasingRequest/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface PurchasingRequest {
  _id: string
  title?: string
  description?: string
  status?: string
  currentStep?: number
  quantity?: number
  estimatedAmount?: number
  selectionType?: string
  stuffStatus?: string
  createdAt?: string
  process?: { _id: string; name?: string }
  requester?: { _id: string; first_name?: string; last_name?: string }
  requestingUnit?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
}

interface PurchasingRequestsClientProps {
  items: PurchasingRequest[]
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
  { value: "title-asc", label: "عنوان" },
  { value: "title-desc", label: "عنوان معکوس" },
  { value: "status-asc", label: "وضعیت" },
  { value: "amount-desc", label: "بیشترین مبلغ" },
  { value: "amount-asc", label: "کمترین مبلغ" },
]

const statusOptions: FilterOption[] = [
  { value: "Draft", label: "پیش‌نویس" },
  { value: "Pending", label: "در انتظار بررسی" },
  { value: "InProgress", label: "در حال انجام" },
  { value: "Approved", label: "تأیید شده" },
  { value: "PendingFinalization", label: "در انتظار تأیید نهایی" },
  { value: "Rejected", label: "رد شده" },
  { value: "Completed", label: "تکمیل شده" },
  { value: "Cancelled", label: "لغو شده" },
]

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function fullName(user?: { first_name?: string; last_name?: string }): string {
  if (!user) return "—"
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || "—"
}

function PurchasingRequestCard({
  item,
  onDelete,
}: {
  item: PurchasingRequest
  onDelete: (item: PurchasingRequest) => void
}) {
  const stats = [
    { label: "تعداد", value: item.quantity != null ? item.quantity.toLocaleString("fa-IR") : "۰", color: "text-frost-link" },
    {
      label: "مبلغ برآوردی",
      value: item.estimatedAmount != null ? `${item.estimatedAmount.toLocaleString("fa-IR")} ریال` : "۰",
      color: "text-emerald-400",
    },
  ]

  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <ShoppingCart className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/purchasing-requests/${item._id}`}
              className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
              title={item.title}
            >
              {item.title || "بدون عنوان"}
            </Link>
            <RequestStatusBadge status={item.status} />
          </div>
        </div>
      </div>

      {item.description && (
        <p className="line-clamp-2 text-body-sm leading-relaxed text-fog/70">{item.description}</p>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        {stats.map((stat) => (
          <div key={stat.label} className="min-w-0 bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">{stat.label}</p>
            <p className={cn("mt-1 truncate font-mono text-sm font-semibold leading-6", stat.color)} dir="ltr">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-2 border-t border-steel-border/15 pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-body-sm text-fog/70">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Building2 className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{item.requestingUnit?.name || "—"}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <UserRound className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{fullName(item.requester)}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-body-sm text-fog/70">
          {item.process && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Workflow className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{item.process.name || "—"}</span>
            </span>
          )}
          {item.wareModel && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Package className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{item.wareModel.name || "—"}</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/60">
            <CalendarDays className="size-4 text-fog/60" />
            {faDate(item.createdAt)}
          </span>
          <div className="flex items-center gap-1">
            <Link href={`/admin/purchasing-requests/${item._id}`} title="مشاهده و ویرایش">
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

export function PurchasingRequestsClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
  status,
}: PurchasingRequestsClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<PurchasingRequest | null>(null)
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
      router.push(`/admin/purchasing-requests${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleStatus = (value: string | null) => go(makeParams({ status: value ?? "" }))
  const handleReset = () => router.push("/admin/purchasing-requests")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc") || status)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await remove({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: deleteTarget._id,
      })
      if (result.success) {
        toast.success("درخواست خرید با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف درخواست خرید")
      }
    } catch {
      toast.error("خطا در حذف درخواست خرید")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="درخواست‌های خرید"
        description="مدیریت و پیگیری درخواست‌های خرید سازمان"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} درخواست خرید
        </span>
        <Link href="/admin/purchasing-requests/new">
          <Button className="gap-2 px-5">
            <Plus className="size-5" />
            درخواست خرید جدید
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی عنوان درخواست…"
          ariaLabel="جستجوی درخواست خرید"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ShoppingCart}
            placeholder="وضعیت"
            ariaLabel="فیلتر بر اساس وضعیت"
            value={status}
            onValueChange={handleStatus}
            options={statusOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش درخواست‌ها"
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
            <PurchasingRequestCard key={item._id} item={item} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingCart}
          title={hasFilters ? "درخواست خریدی یافت نشد" : "هنوز درخواست خریدی ثبت نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا فیلترها، درخواست موردنظر را پیدا کنید."
              : "نخستین درخواست خرید را برای شروع فرآیند تأیید ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/purchasing-requests/new">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد درخواست خرید
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
        title="حذف درخواست خرید"
        description={`آیا از حذف درخواست خرید «${deleteTarget?.title || "این درخواست"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
