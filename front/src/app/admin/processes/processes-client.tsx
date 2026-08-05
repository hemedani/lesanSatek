"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Workflow,
  Pencil,
  Share2,
  Trash2,
  ArrowDownUp,
  RotateCcw,
  Target,
  Building2,
  BarChart3,
  List,
  Copy,
  CheckCircle2,
  Users,
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
import { remove } from "@/app/actions/process/remove"
import { activateProcess } from "@/app/actions/process/activateProcess"
import { duplicateProcess } from "@/app/actions/process/duplicateProcess"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface Process {
  _id: string
  name?: string
  description?: string
  status?: string
  version?: number
  isActive?: boolean
  createdAt?: string
  organization?: { _id: string; name?: string }
  createdBy?: { _id: string; first_name?: string; last_name?: string }
  unit?: { _id: string; name?: string }
  wareType?: { _id: string; name?: string }
  wareClass?: { _id: string; name?: string }
  wareGroup?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
  ware?: { _id: string; name?: string }
}

export interface OrgOption {
  _id: string
  name?: string
}

interface ProcessesClientProps {
  items: Process[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
  search: string
  sort: string
  organization: string
  organizations: OrgOption[]
}

const sortOptions: FilterOption[] = [
  { value: "createdAt-desc", label: "جدیدترین" },
  { value: "createdAt-asc", label: "قدیمی‌ترین" },
  { value: "name-asc", label: "نام" },
  { value: "name-desc", label: "نام معکوس" },
]

const statusLabels: Record<string, { label: string; variant: "active" | "inactive" | "pending" | "info" }> = {
  Draft: { label: "پیش‌نویس", variant: "inactive" },
  Active: { label: "فعال", variant: "active" },
  Archived: { label: "بایگانی", variant: "pending" },
}

function faDate(iso?: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
}

function getScopeLabel(item: Process): string {
  if (item.unit?.name) return `واحد: ${item.unit.name}`
  if (item.ware?.name) return `کالا: ${item.ware.name}`
  if (item.wareModel?.name) return `مدل: ${item.wareModel.name}`
  if (item.wareGroup?.name) return `گروه: ${item.wareGroup.name}`
  if (item.wareClass?.name) return `رده: ${item.wareClass.name}`
  if (item.wareType?.name) return `نوع: ${item.wareType.name}`
  return "عمومی"
}

function ProcessCard({
  item,
  onActivate,
  onDuplicate,
  onDelete,
}: {
  item: Process
  onActivate: (item: Process) => void
  onDuplicate: (item: Process) => void
  onDelete: (item: Process) => void
}) {
  const statusInfo = statusLabels[item.status || ""] || { label: item.status || "—", variant: "inactive" as const }
  const createdByName = item.createdBy
    ? [item.createdBy.first_name, item.createdBy.last_name].filter(Boolean).join(" ")
    : ""

  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <Workflow className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/processes/${item._id}`}
              className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
            >
              {item.name || "بدون نام"}
            </Link>
            <div className="flex items-center gap-2 text-xs text-fog/60">
              <StatusBadge status={statusInfo.variant} label={statusInfo.label} />
              <span className="font-mono text-fog/50">v{item.version || 1}</span>
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
          <p className="text-[11px] text-fog/60">حوزه کاربرد</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">{getScopeLabel(item)}</p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">ایجادکننده</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">{createdByName || "—"}</p>
        </div>
      </div>

      {item.description && (
        <div className="mt-auto flex items-start gap-2 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
          <Target className="mt-0.5 size-4 shrink-0 text-fog/60" />
          <span className="line-clamp-2">{item.description}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
          <Building2 className="size-4 text-fog/60" />
          {faDate(item.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Link href={`/admin/processes/${item._id}`} title="ویرایش">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-moonlight">
              <Pencil className="size-5" />
            </Button>
          </Link>
          <Link href={`/admin/processes/${item._id}/graph`} title="نمودار">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-electric-iris">
              <BarChart3 className="size-5" />
            </Button>
          </Link>
          <Link href={`/admin/processes/${item._id}/steps`} title="گام‌ها">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-frost-link">
              <List className="size-5" />
            </Button>
          </Link>
          <Link href={`/admin/processes/${item._id}/relations`} title="روابط">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-amber-400">
              <Share2 className="size-5" />
            </Button>
          </Link>
          {item.status === "Draft" && (
            <Button
              variant="ghost"
              size="icon-lg"
              className="size-9 text-fog/60 hover:text-emerald-400"
              title="فعال‌سازی"
              onClick={() => onActivate(item)}
            >
              <CheckCircle2 className="size-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-lg"
            className="size-9 text-fog/60 hover:text-frost-link"
            title="کپی"
            onClick={() => onDuplicate(item)}
          >
            <Copy className="size-5" />
          </Button>
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

export function ProcessesClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  search,
  sort,
  organization,
  organizations,
}: ProcessesClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Process | null>(null)
  const [deleting, setDeleting] = useState(false)

  const makeParams = useCallback(
    (next: { search?: string; sort?: string; organization?: string }) => {
      const params = new URLSearchParams()
      const nextSearch = (next.search ?? search).trim()
      const nextSort = next.sort ?? sort
      const nextOrg = next.organization ?? organization
      if (nextSearch) params.set("search", nextSearch)
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort)
      if (nextOrg) params.set("organization", nextOrg)
      return params.toString()
    },
    [search, sort, organization],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`/admin/processes${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleOrganization = (value: string | null) => go(makeParams({ organization: value ?? "" }))
  const handleReset = () => router.push("/admin/processes")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc") || organization)

  const organizationOptions: FilterOption[] = organizations.map((org) => ({
    value: org._id,
    label: org.name || org._id,
  }))

  const handleActivate = async (process: Process) => {
    const result = await activateProcess({
      activeRoleId: getActiveRoleIdFromStore(),
      _id: process._id,
    })
    if (result.success) {
      toast.success("فرآیند با موفقیت فعال شد")
      router.refresh()
    } else {
      toast.error(result.body?.message || "خطا در فعال‌سازی فرآیند")
    }
  }

  const handleDuplicate = async (process: Process) => {
    const name = `${process.name || "فرآیند"} (کپی)`
    const result = await duplicateProcess({
      activeRoleId: getActiveRoleIdFromStore(),
      _id: process._id,
      name,
    })
    if (result.success) {
      toast.success("فرآیند با موفقیت کپی شد")
      router.refresh()
    } else {
      toast.error(result.body?.message || "خطا در کپی فرآیند")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await remove({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: deleteTarget._id,
      })
      if (result.success) {
        toast.success("فرآیند با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف فرآیند")
      }
    } catch {
      toast.error("خطا در حذف فرآیند")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="فرآیندها"
        description="مدیریت فرآیندهای خرید سازمان — وضعیت، نسخه و حوزه کاربرد هر فرآیند"
      >
        <div className="flex items-center gap-2">
          <HelpLauncher topicId="admin-processes-list" tooltip="راهنمای مدیریت فرآیندها" />
          <Link href="/admin/processes/add">
            <Button className="gap-2 px-5">
              <Plus className="size-5" />
              افزودن فرآیند
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی فرآیند…"
          ariaLabel="جستجوی فرآیند"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={Building2}
            placeholder="سازمان"
            ariaLabel="فیلتر بر اساس سازمان"
            value={organization}
            onValueChange={handleOrganization}
            options={organizationOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش فرآیندها"
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
            <ProcessCard
              key={item._id}
              item={item}
              onActivate={handleActivate}
              onDuplicate={handleDuplicate}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={hasFilters ? "فرآیندی یافت نشد" : "هنوز فرآیندی ایجاد نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا فیلترها، فرآیند موردنظر را پیدا کنید."
              : "اولین فرآیند را برای شروع تعریف گردش کار خرید ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/processes/add">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد فرآیند
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
        title="حذف فرآیند"
        description={`آیا از حذف «${deleteTarget?.name || "این فرآیند"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
