"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  GitBranch,
  Warehouse,
  Truck,
  Factory,
  Building2,
  Banknote,
  GraduationCap,
  Pencil,
  Share2,
  Trash2,
  ArrowDownUp,
  RotateCcw,
  Building,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { SearchField } from "@/components/ui/search-field"
import { FilterSelect } from "@/components/ui/filter-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { HelpLauncher } from "@/components/help/help-launcher"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove as removeUnit } from "@/app/actions/unit/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface Unit {
  _id: string
  name?: string
  type?: string
  isActive?: boolean
  description?: string
  createdAt?: string
  organization?: { _id: string; name?: string }
  parentUnit?: { _id: string; name?: string }
  head?: { _id: string; first_name?: string; last_name?: string }
}

export interface OrganizationOption {
  _id: string
  name?: string
}

interface UnitsClientProps {
  items: Unit[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages?: number
  search: string
  orgId: string
  type: string
  sort: string
  orgOptions: OrganizationOption[]
}

const typeLabels: Record<string, string> = {
  General: "عمومی",
  Warehouse: "انبار",
  Logistics: "تدارکات",
  Production: "تولید",
  Administration: "اداری",
  Finance: "مالی",
  Expert: "کارشناسی",
}

const typeOptions: FilterOption[] = Object.entries(typeLabels).map(([value, label]) => ({
  value,
  label,
}))

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "name-asc", label: "نام" },
  { value: "name-desc", label: "نام معکوس" },
]

const typeIcons: Record<string, React.ElementType> = {
  Warehouse,
  Logistics: Truck,
  Production: Factory,
  Administration: Building2,
  Finance: Banknote,
  Expert: GraduationCap,
}

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function UnitCard({
  item,
  onDelete,
}: {
  item: Unit
  onDelete: (item: Unit) => void
}) {
  const Icon = typeIcons[item.type || ""] || GitBranch
  const headName = item.head
    ? [item.head.first_name, item.head.last_name].filter(Boolean).join(" ")
    : ""

  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <Icon className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/units/${item._id}`}
              className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
            >
              {item.name || "بدون نام"}
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex rounded-full bg-frost-link/10 px-2 py-0.5 text-xs font-medium text-frost-link ring-1 ring-inset ring-frost-link/15">
                {typeLabels[item.type || ""] || item.type || "—"}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge
          status={item.isActive ? "active" : "inactive"}
          label={item.isActive ? "فعال" : "غیرفعال"}
        />
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">سازمان</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">{item.organization?.name || "—"}</p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">رئیس</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">{headName || "—"}</p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">واحد والد</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">{item.parentUnit?.name || "—"}</p>
        </div>
      </div>

      {item.description && (
        <div className="mt-auto flex items-start gap-2 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
          <Building className="mt-0.5 size-4 shrink-0 text-fog/60" />
          <span className="line-clamp-2">{item.description}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
          {faDate(item.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Link href={`/admin/units/${item._id}`} title="ویرایش">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-moonlight">
              <Pencil className="size-5" />
            </Button>
          </Link>
          <Link href={`/admin/units/${item._id}/relations`} title="روابط">
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

export function UnitsClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  search = "",
  orgId = "",
  type = "",
  sort = "createdAt-desc",
  orgOptions = [],
}: UnitsClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null)
  const [deleting, setDeleting] = useState(false)

  const makeParams = useCallback(
    (next: { search?: string; orgId?: string; type?: string; sort?: string }) => {
      const params = new URLSearchParams()
      const nextSearch = (next.search ?? search).trim()
      const nextOrg = next.orgId ?? orgId
      const nextType = next.type ?? type
      const nextSort = next.sort ?? sort
      if (nextSearch) params.set("search", nextSearch)
      if (nextOrg) params.set("orgId", nextOrg)
      if (nextType) params.set("type", nextType)
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort)
      return params.toString()
    },
    [search, orgId, type, sort],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`/admin/units${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleOrg = (value: string | null) => go(makeParams({ orgId: value ?? "" }))
  const handleType = (value: string | null) => go(makeParams({ type: value ?? "" }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleReset = () => router.push("/admin/units")

  const hasFilters = Boolean(search || orgId || type || (sort && sort !== "createdAt-desc"))

  const orgFilterOptions: FilterOption[] = orgOptions.map((o) => ({
    value: o._id,
    label: o.name || o._id,
  }))

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await removeUnit({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: deleteTarget._id,
      })
      if (result.success) {
        toast.success("واحد با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف واحد")
      }
    } catch {
      toast.error("خطا در حذف واحد")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="واحدها"
        description="مدیریت واحدها و زیرواحدهای سازمان‌ها — رئیس، سازمان و موقعیت هر واحد"
      >
        <div className="flex items-center gap-2">
          <HelpLauncher topicId="admin-units-list" tooltip="راهنمای فهرست واحدها" />
          <HelpLauncher topicId="admin-units-hierarchy" tooltip="راهنمای ساختار درختی واحدها" />
          <Link href="/admin/units/add">
            <Button className="gap-2 px-5">
              <Plus className="size-5" />
              افزودن واحد
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی واحد…"
          ariaLabel="جستجوی واحد"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={Building}
            placeholder="همه سازمان‌ها"
            ariaLabel="فیلتر بر اساس سازمان"
            value={orgId}
            onValueChange={handleOrg}
            options={orgFilterOptions}
          />
          <FilterSelect
            icon={GitBranch}
            placeholder="همه انواع"
            ariaLabel="فیلتر بر اساس نوع واحد"
            value={type}
            onValueChange={handleType}
            options={typeOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش واحدها"
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
            <UnitCard key={item._id} item={item} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building}
          title={hasFilters ? "واحدی یافت نشد" : "هنوز واحدی ایجاد نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا فیلترها، واحد موردنظر را پیدا کنید."
              : "اولین واحد را برای شروع مدیریت سازمان خود ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/units/add">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد واحد
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
        title="حذف واحد"
        description={`آیا از حذف «${deleteTarget?.name || "این واحد"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
