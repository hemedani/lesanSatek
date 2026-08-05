"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, ReceiptText, Pencil, Trash2, ArrowDownUp, RotateCcw, CalendarDays, BadgeCheck, ShoppingCart } from "lucide-react"
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
import { remove } from "@/app/actions/paymentOrder/remove"
import { markPaid } from "@/app/actions/paymentOrder/markPaid"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface PaymentOrder {
  _id: string
  title?: string
  amount?: number
  description?: string
  status?: string
  paidAt?: string
  createdAt?: string
  purchasingRequest?: { _id: string; title?: string }
  payTo?: { _id: string; name?: string }
}

interface PaymentOrdersClientProps {
  items: PaymentOrder[]
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
  { value: "amount-desc", label: "بیشترین مبلغ" },
  { value: "amount-asc", label: "کمترین مبلغ" },
  { value: "paidAt-desc", label: "جدیدترین تاریخ پرداخت" },
  { value: "paidAt-asc", label: "قدیمی‌ترین تاریخ پرداخت" },
  { value: "title-asc", label: "عنوان" },
]

const statusOptions: FilterOption[] = [
  { value: "draft", label: "پیش‌نویس" },
  { value: "sent_to_finance", label: "ارسال به مالی" },
  { value: "paid", label: "پرداخت شده" },
  { value: "cancelled", label: "لغو شده" },
]

function faNum(value?: number | string): string {
  if (value === undefined || value === null || value === "") return "—"
  if (typeof value === "number") return value.toLocaleString("fa-IR")
  return String(value)
}

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function PaymentOrderCard({
  item,
  onDelete,
  onMarkPaid,
}: {
  item: PaymentOrder
  onDelete: (item: PaymentOrder) => void
  onMarkPaid: (item: PaymentOrder) => void
}) {
  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <ReceiptText className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/payment-orders/${item._id}`}
              className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
              title={item.title}
            >
              {item.title || "بدون عنوان"}
            </Link>
            <StatusBadge status={item.status || "draft"} size="sm" />
          </div>
        </div>
      </div>

      {item.description && (
        <p className="line-clamp-2 text-body-sm leading-relaxed text-fog/70">{item.description}</p>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">مبلغ</p>
          <p className="mt-1 truncate text-sm font-medium leading-6 text-frost-link" dir="ltr">
            {faNum(item.amount)} ریال
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">دریافت‌کننده</p>
          <p className="mt-1 truncate text-sm font-medium leading-6 text-moonlight">{item.payTo?.name || "—"}</p>
        </div>
      </div>

      <div className="mt-auto space-y-2 border-t border-steel-border/15 pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-body-sm text-fog/70">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <ShoppingCart className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{item.purchasingRequest?.title || "—"}</span>
          </span>
          {item.paidAt && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <BadgeCheck className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{faDate(item.paidAt)}</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/60">
            <CalendarDays className="size-4 text-fog/60" />
            {faDate(item.createdAt)}
          </span>
          <div className="flex items-center gap-1">
            {item.status === "sent_to_finance" && (
              <Button
                variant="ghost"
                size="icon-lg"
                className="size-9 text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/5"
                title="ثبت پرداخت"
                onClick={() => onMarkPaid(item)}
              >
                <BadgeCheck className="size-5" />
              </Button>
            )}
            <Link href={`/admin/payment-orders/${item._id}`} title="مشاهده و ویرایش">
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

export function PaymentOrdersClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
  status,
}: PaymentOrdersClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<PaymentOrder | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [payTarget, setPayTarget] = useState<PaymentOrder | null>(null)
  const [paying, setPaying] = useState(false)

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
      router.push(`/admin/payment-orders${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleStatus = (value: string | null) => go(makeParams({ status: value ?? "" }))
  const handleReset = () => router.push("/admin/payment-orders")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc") || status)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await remove({ _id: deleteTarget._id })
      if (result.success) {
        toast.success("دستور پرداخت با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف دستور پرداخت")
      }
    } catch {
      toast.error("خطا در حذف دستور پرداخت")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleMarkPaid = async () => {
    if (!payTarget) return
    setPaying(true)
    try {
      const result = await markPaid(
        { activeRoleId: getActiveRoleIdFromStore(), _id: payTarget._id },
        { _id: 1, status: 1 }
      )
      if (result.success) {
        toast.success("پرداخت با موفقیت ثبت شد.")
        setPayTarget(null)
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در ثبت پرداخت")
      }
    } catch {
      toast.error("خطا در ثبت پرداخت")
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="دستورات پرداخت"
        description="مدیریت پرداخت‌ها و دستورات صادرشده"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} دستور پرداخت
        </span>
        <Link href="/admin/payment-orders/add">
          <Button className="gap-2 px-5">
            <Plus className="size-5" />
            دستور پرداخت جدید
          </Button>
        </Link>
        <HelpLauncher topicId="admin-payment-orders" tooltip="راهنمای دستورات پرداخت" />
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی عنوان یا مبلغ…"
          ariaLabel="جستجوی دستور پرداخت"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ReceiptText}
            placeholder="وضعیت"
            ariaLabel="فیلتر بر اساس وضعیت"
            value={status}
            onValueChange={handleStatus}
            options={statusOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش دستورات پرداخت"
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
            <PaymentOrderCard key={item._id} item={item} onDelete={setDeleteTarget} onMarkPaid={setPayTarget} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ReceiptText}
          title={hasFilters ? "دستور پرداختی یافت نشد" : "هنوز دستور پرداختی ثبت نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا فیلترها، دستور پرداخت موردنظر را پیدا کنید."
              : "برای صدور پرداخت، نخستین دستور پرداخت را ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/payment-orders/add">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد دستور پرداخت
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
        title="حذف دستور پرداخت"
        description={`آیا از حذف دستور پرداخت «${deleteTarget?.title || "این دستور"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />

      <ConfirmDialog
        open={!!payTarget}
        onOpenChange={(open) => { if (!open) setPayTarget(null) }}
        title="ثبت پرداخت"
        description={`آیا از پرداخت «${payTarget?.title || ""}» به مبلغ ${faNum(payTarget?.amount)} ریال اطمینان دارید؟`}
        confirmLabel={paying ? "در حال ثبت..." : "تأیید پرداخت"}
        onConfirm={handleMarkPaid}
        loading={paying}
      />
    </div>
  )
}