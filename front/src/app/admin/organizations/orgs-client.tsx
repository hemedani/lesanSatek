"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Building2,
  MapPin,
  CalendarDays,
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
import { HelpButton } from "@/components/help/help-button"
import { HelpModal } from "@/components/help/help-modal"
import type { FilterOption } from "@/components/ui/filter-select"
import { remove as removeOrganization } from "@/app/actions/organization/remove"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface Organization {
  _id: string
  name?: string
  enName?: string
  description?: string
  isActive?: boolean
  createdAt?: string
  head?: { _id: string; first_name?: string; last_name?: string }
  city?: { _id: string; name?: string }
  state?: { _id: string; name?: string }
}

interface OrganizationsClientProps {
  items: Organization[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages?: number
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

function OrganizationCard({
  item,
  onDelete,
  onHelp,
}: {
  item: Organization
  onDelete: (item: Organization) => void
  onHelp: () => void
}) {
  const headName = item.head
    ? [item.head.first_name, item.head.last_name].filter(Boolean).join(" ")
    : ""

  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <Building2 className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/organizations/${item._id}`}
              className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
            >
              {item.name || "بدون نام"}
            </Link>
            {item.enName && (
              <p className="truncate text-xs text-fog/70">{item.enName}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <HelpButton tooltip="راهنمای کارت سازمان" onClick={onHelp} />
          <StatusBadge
            status={item.isActive ? "active" : "inactive"}
            label={item.isActive ? "فعال" : "غیرفعال"}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">رئیس</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">{headName || "—"}</p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">شهر</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">{item.city?.name || "—"}</p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">استان</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6">{item.state?.name || "—"}</p>
        </div>
      </div>

      {item.description && (
        <div className="mt-auto flex items-start gap-2 border-t border-steel-border/15 pt-3 text-body-sm text-fog">
          <MapPin className="mt-0.5 size-4 shrink-0 text-fog/60" />
          <span className="line-clamp-2">{item.description}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
          <CalendarDays className="size-4 text-fog/60" />
          {faDate(item.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Link href={`/admin/organizations/${item._id}`} title="ویرایش">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-moonlight">
              <Pencil className="size-5" />
            </Button>
          </Link>
          <Link href={`/admin/organizations/${item._id}/relations`} title="روابط">
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

export function OrganizationsClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  search,
  sort,
}: OrganizationsClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showCardHelp, setShowCardHelp] = useState(false)

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
      router.push(`/admin/organizations${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleReset = () => router.push("/admin/organizations")

  const hasFilters = Boolean(search || (sort && sort !== "createdAt-desc"))

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await removeOrganization({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: deleteTarget._id,
      })
      if (result.success) {
        toast.success("سازمان با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف سازمان")
      }
    } catch {
      toast.error("خطا در حذف سازمان")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="سازمان‌ها"
        description="مدیریت سازمان‌های فعال در سامانه — رئیس، موقعیت و وضعیت هر سازمان"
      >
        <div className="flex items-center gap-2">
          <HelpLauncher topicId="admin-orgs-list" tooltip="راهنمای فهرست سازمان‌ها" />
          <Link href="/admin/organizations/add">
            <Button className="gap-2 px-5">
              <Plus className="size-5" />
              افزودن سازمان
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی سازمان…"
          ariaLabel="جستجوی سازمان"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش سازمان‌ها"
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
            <OrganizationCard
              key={item._id}
              item={item}
              onDelete={setDeleteTarget}
              onHelp={() => setShowCardHelp(true)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building}
          title={hasFilters ? "سازمانی یافت نشد" : "هنوز سازمانی ایجاد نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا مرتب‌سازی، سازمان موردنظر را پیدا کنید."
              : "اولین سازمان را برای شروع مدیریت فرآیندها ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/organizations/add">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد سازمان
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
        title="حذف سازمان"
        description={`آیا از حذف «${deleteTarget?.name || "این سازمان"}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />

      <HelpModal
        isOpen={showCardHelp}
        onClose={() => setShowCardHelp(false)}
        topicId="admin-org-cards"
      />
    </div>
  )
}
