"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Map, Pencil, Trash2, ArrowDownUp, RotateCcw, CalendarDays } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove } from "@/app/actions/state/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface State {
  _id: string
  name?: string
  enName?: string
  createdAt?: string
  cities?: { _id: string }[]
}

interface StatesClientProps {
  items: State[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
  total: number
  search: string
  sort: string
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "name-asc", label: "نام" },
  { value: "name-desc", label: "نام معکوس" },
]

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function StateCard({
  item,
  onDelete,
}: {
  item: State
  onDelete: (item: State) => void
}) {
  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <Map className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/states/${item._id}`}
              className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
            >
              {item.name || "بدون نام"}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">نام لاتین</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6" dir="ltr">
            {item.enName || "—"}
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">شمار شهرها</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">
            {(item.cities?.length || 0).toLocaleString("fa-IR")} شهر
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
          <CalendarDays className="size-4 text-fog/60" />
          {faDate(item.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Link href={`/admin/states/${item._id}`} title="ویرایش">
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
  )
}

export function StatesClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
}: StatesClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<State | null>(null)
  const [deleting, setDeleting] = useState(false)

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
      router.push(`/admin/states${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleReset = () => router.push("/admin/states")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc"))

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await remove({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: deleteTarget._id,
      })
      if (result.success) {
        toast.success("استان با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف استان")
      }
    } catch {
      toast.error("خطا در حذف استان")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="مدیریت استان‌ها"
        description="مدیریت استان‌های کشور و شمار شهرهای هر استان"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} استان
        </span>
        <Link href="/admin/states/add">
          <Button className="gap-2 px-5">
            <Plus className="size-5" />
            افزودن استان
          </Button>
        </Link>
        <HelpLauncher topicId="admin-states" tooltip="راهنمای استان‌ها" />
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی استان…"
          ariaLabel="جستجوی استان"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش استان‌ها"
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
            <StateCard key={item._id} item={item} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Map}
          title={hasFilters ? "استانی یافت نشد" : "هنوز استانی تعریف نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا مرتب‌سازی، استان موردنظر را پیدا کنید."
              : "نخستین استان را برای ساماندهی موقعیت جغرافیایی ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/states/add">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد استان
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="حذف استان"
        description={`آیا از حذف استان «${deleteTarget?.name || "این استان"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
