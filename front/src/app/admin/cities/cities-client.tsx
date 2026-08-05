"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, MapPin, Pencil, Trash2, ArrowDownUp, RotateCcw, Building2, Share2, CalendarDays } from "lucide-react"
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
import { remove } from "@/app/actions/city/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface City {
  _id: string
  name?: string
  enName?: string
  createdAt?: string
  state?: { _id: string; name?: string }
}

export interface State {
  _id: string
  name?: string
}

interface CitiesClientProps {
  items: City[]
  states: State[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
  total: number
  search: string
  sort: string
  stateId: string
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

function CityCard({
  item,
  onDelete,
}: {
  item: City
  onDelete: (item: City) => void
}) {
  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <MapPin className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/cities/${item._id}`}
              className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
            >
              {item.name || "بدون نام"}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">استان</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6" title={item.state?.name}>
            {item.state?.name || "—"}
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">نام لاتین</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6" dir="ltr">
            {item.enName || "—"}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
          <CalendarDays className="size-4 text-fog/60" />
          {faDate(item.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Link href={`/admin/cities/${item._id}`} title="ویرایش">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-moonlight">
              <Pencil className="size-5" />
            </Button>
          </Link>
          <Link href={`/admin/cities/${item._id}/relations`} title="روابط">
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
  )
}

export function CitiesClient({
  items,
  states,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
  search,
  sort,
  stateId,
}: CitiesClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<City | null>(null)
  const [deleting, setDeleting] = useState(false)

  const stateOptions: FilterOption[] = states.map((s) => ({
    value: s._id,
    label: s.name || s._id,
  }))

  const makeParams = useCallback(
    (next: { search?: string; sort?: string; stateId?: string }) => {
      const params = new URLSearchParams()
      const nextSearch = (next.search ?? search).trim()
      const nextSort = next.sort ?? sort
      const nextStateId = next.stateId ?? stateId
      if (nextSearch) params.set("search", nextSearch)
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort)
      if (nextStateId) params.set("stateId", nextStateId)
      return params.toString()
    },
    [search, sort, stateId],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`/admin/cities${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleState = (value: string | null) => go(makeParams({ stateId: value ?? "" }))
  const handleReset = () => router.push("/admin/cities")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc") || stateId)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await remove({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: deleteTarget._id,
      })
      if (result.success) {
        toast.success("شهر با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف شهر")
      }
    } catch {
      toast.error("خطا در حذف شهر")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="مدیریت شهرها"
        description="مدیریت شهرهای کشور و ارتباط آن‌ها با استان‌ها"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-body-sm text-fog">
          <span className="size-1.5 rounded-full bg-electric-iris" aria-hidden="true" />
          {total.toLocaleString("fa-IR")} شهر
        </span>
        <Link href="/admin/cities/add">
          <Button className="gap-2 px-5">
            <Plus className="size-5" />
            افزودن شهر
          </Button>
        </Link>
        <HelpLauncher topicId="admin-cities" tooltip="راهنمای شهرها" />
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی شهر…"
          ariaLabel="جستجوی شهر"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={Building2}
            placeholder="استان"
            ariaLabel="فیلتر بر اساس استان"
            value={stateId}
            onValueChange={handleState}
            options={stateOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش شهرها"
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
            <CityCard key={item._id} item={item} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title={hasFilters ? "شهری یافت نشد" : "هنوز شهری تعریف نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا فیلترها، شهر موردنظر را پیدا کنید."
              : "نخستین شهر را برای تکمیل سلسله‌مراتب موقعیت جغرافیایی ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/cities/add">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد شهر
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
        title="حذف شهر"
        description={`آیا از حذف شهر «${deleteTarget?.name || "این شهر"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
