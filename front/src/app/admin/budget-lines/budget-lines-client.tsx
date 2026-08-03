"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Wallet, Pencil, Trash2, ArrowDownUp, RotateCcw, CalendarDays, Share2, Building2, Landmark, Boxes } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { FilterOption } from "@/components/ui/filter-select"
import { cn } from "@/lib/utils"
import { remove } from "@/app/actions/budgetLine/remove"

export interface BudgetLine {
  _id: string
  code?: string
  title?: string
  description?: string
  totalAllocated?: number
  totalEncumbered?: number
  totalSpent?: number
  remainingBudget?: number
  createdAt?: string
  fiscalYear?: { _id: string; name?: string }
  organization?: { _id: string; name?: string }
  unit?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
}

interface BudgetLinesClientProps {
  items: BudgetLine[]
  fiscalYears: { _id: string; name?: string }[]
  organizations: { _id: string; name?: string }[]
  units: { _id: string; name?: string }[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
  total: number
  search: string
  sort: string
  fiscalYearId: string
  organizationId: string
  unitId: string
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "code-asc", label: "کد" },
  { value: "code-desc", label: "کد معکوس" },
  { value: "title-asc", label: "عنوان" },
  { value: "title-desc", label: "عنوان معکوس" },
  { value: "totalAllocated-desc", label: "بیشترین تخصیص" },
  { value: "totalAllocated-asc", label: "کمترین تخصیص" },
]

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function faMoney(value?: number): string {
  if (value == null) return "۰"
  return value.toLocaleString("fa-IR")
}

function BudgetLineCard({
  item,
  onDelete,
}: {
  item: BudgetLine
  onDelete: (item: BudgetLine) => void
}) {
  const remaining = item.remainingBudget ?? 0

  const moneyStats = [
    { label: "تخصیص یافته", value: item.totalAllocated, color: "text-frost-link" },
    { label: "تعهد شده", value: item.totalEncumbered, color: "text-amber-400" },
    { label: "مصرف شده", value: item.totalSpent, color: "text-rose-400" },
    { label: "باقی‌مانده", value: remaining, color: remaining < 0 ? "text-rose-400" : "text-emerald-400" },
  ]

  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <Wallet className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/budget-lines/${item._id}`}
              className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
              title={item.title}
            >
              {item.title || "بدون عنوان"}
            </Link>
            <p className="inline-flex items-center rounded-sm bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-fog/70 ring-1 ring-inset ring-white/[0.06]" dir="ltr">
              {item.code || "—"}
            </p>
          </div>
        </div>
      </div>

      {item.description && (
        <p className="line-clamp-2 text-body-sm leading-relaxed text-fog/70">{item.description}</p>
      )}

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        {moneyStats.map((stat) => (
          <div key={stat.label} className="min-w-0 bg-[#05060f]/60 p-3 text-center">
            <p className="text-[11px] text-fog/60">{stat.label}</p>
            <p className={cn("mt-1 truncate font-mono text-sm font-semibold leading-6", stat.color)} dir="ltr">
              {faMoney(stat.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-2 border-t border-steel-border/15 pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-body-sm text-fog/70">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Building2 className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{item.organization?.name || "—"}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <Landmark className="size-4 shrink-0 text-fog/60" />
            <span className="truncate">{item.fiscalYear?.name || "—"}</span>
          </span>
          {(item.unit || item.wareType) && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Boxes className="size-4 shrink-0 text-fog/60" />
              <span className="truncate">{[item.unit?.name, item.wareType?.name].filter(Boolean).join(" · ") || "—"}</span>
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/60">
            <CalendarDays className="size-4 text-fog/60" />
            {faDate(item.createdAt)}
          </span>
          <div className="flex items-center gap-1">
            <Link href={`/admin/budget-lines/${item._id}`} title="ویرایش">
              <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-moonlight">
                <Pencil className="size-5" />
              </Button>
            </Link>
            <Link href={`/admin/budget-lines/${item._id}/relations`} title="ویرایش روابط">
              <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-frost-link">
                <Share2 className="size-5" />
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

export function BudgetLinesClient({
  items,
  fiscalYears,
  organizations,
  units,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
  fiscalYearId,
  organizationId,
  unitId,
}: BudgetLinesClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<BudgetLine | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fiscalYearOptions: FilterOption[] = fiscalYears.map((fy) => ({ value: fy._id, label: fy.name || fy._id }))
  const organizationOptions: FilterOption[] = organizations.map((o) => ({ value: o._id, label: o.name || o._id }))
  const unitOptions: FilterOption[] = units.map((u) => ({ value: u._id, label: u.name || u._id }))

  const makeParams = useCallback(
    (next: { search?: string; sort?: string; fiscalYearId?: string; organizationId?: string; unitId?: string }) => {
      const params = new URLSearchParams()
      const nextSearch = (next.search ?? search).trim()
      const nextSort = next.sort ?? sort
      const nextFiscalYear = next.fiscalYearId ?? fiscalYearId
      const nextOrganization = next.organizationId ?? organizationId
      const nextUnit = next.unitId ?? unitId
      if (nextSearch) params.set("search", nextSearch)
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort)
      if (nextFiscalYear) params.set("fiscalYearId", nextFiscalYear)
      if (nextOrganization) params.set("organizationId", nextOrganization)
      if (nextUnit) params.set("unitId", nextUnit)
      return params.toString()
    },
    [search, sort, fiscalYearId, organizationId, unitId],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`/admin/budget-lines${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleFiscalYear = (value: string | null) => go(makeParams({ fiscalYearId: value ?? "" }))
  const handleOrganization = (value: string | null) => go(makeParams({ organizationId: value ?? "" }))
  const handleUnit = (value: string | null) => go(makeParams({ unitId: value ?? "" }))
  const handleReset = () => router.push("/admin/budget-lines")

  const hasFilters = Boolean(
    search ||
      (sort && sort !== "createdAt-desc") ||
      fiscalYearId ||
      organizationId ||
      unitId,
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await remove({ _id: deleteTarget._id })
      if (result.success) {
        toast.success("ردیف بودجه با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف ردیف بودجه")
      }
    } catch {
      toast.error("خطا در حذف ردیف بودجه")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="ردیف‌های بودجه"
        description="مدیریت ردیف‌های بودجه، تخصیص‌ها و مانده‌های سازمان"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} ردیف بودجه
        </span>
        <Link href="/admin/budget-lines/add">
          <Button className="gap-2 px-5">
            <Plus className="size-5" />
            افزودن ردیف بودجه
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی عنوان ردیف بودجه…"
          ariaLabel="جستجوی ردیف بودجه"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={Landmark}
            placeholder="سال مالی"
            ariaLabel="فیلتر بر اساس سال مالی"
            value={fiscalYearId}
            onValueChange={handleFiscalYear}
            options={fiscalYearOptions}
          />
          <FilterSelect
            icon={Building2}
            placeholder="سازمان"
            ariaLabel="فیلتر بر اساس سازمان"
            value={organizationId}
            onValueChange={handleOrganization}
            options={organizationOptions}
          />
          <FilterSelect
            icon={Boxes}
            placeholder="واحد"
            ariaLabel="فیلتر بر اساس واحد"
            value={unitId}
            onValueChange={handleUnit}
            options={unitOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش ردیف‌های بودجه"
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
            <BudgetLineCard key={item._id} item={item} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Wallet}
          title={hasFilters ? "ردیف بودجه‌ای یافت نشد" : "هنوز ردیف بودجه‌ای تعریف نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا فیلترها، ردیف بودجه موردنظر را پیدا کنید."
              : "نخستین ردیف بودجه را برای شروع مدیریت تخصیص‌ها ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/budget-lines/add">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد ردیف بودجه
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
        title="حذف ردیف بودجه"
        description={`آیا از حذف ردیف بودجه «${deleteTarget?.title || deleteTarget?.code || "این ردیف"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
