"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  User,
  CalendarDays,
  Pencil,
  Share2,
  Shield,
  Trash2,
  ArrowDownUp,
  RotateCcw,
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
import { Badge } from "@/components/ui/badge"
import type { FilterOption } from "@/components/ui/filter-select"
import { removeUser } from "@/app/actions/user/removeUser"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

export interface UserRole {
  roleId?: string
  name?: string
  scopeType?: "organization" | "unit" | "store"
  scopeId?: string
}

export interface User {
  _id: string
  first_name?: string
  last_name?: string
  email?: string
  mobile?: string
  isActive?: boolean
  position?: string
  createdAt?: string
  roles?: UserRole[]
  organizations?: { _id: string; name?: string }[]
}

export type ScopeNameMap = Record<string, string>

interface UsersClientProps {
  items: User[]
  prevUrl: string
  nextUrl: string
  page: number
  totalPages?: number
  search: string
  role: string
  sort: string
  scopeNameMap: ScopeNameMap
}

const ROLE_LABELS: Record<string, string> = {
  Manager: "مدیر",
  Admin: "ادمین",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
  StoreHead: "رئیس انبار",
  Employee: "کارمند",
  Ordinary: "عادی",
}

const roleOptions: FilterOption[] = [
  { value: "Manager", label: "مدیر" },
  { value: "Admin", label: "ادمین" },
  { value: "OrgHead", label: "رئیس سازمان" },
  { value: "UnitHead", label: "رئیس واحد" },
  { value: "StoreHead", label: "رئیس انبار" },
  { value: "Employee", label: "کارمند" },
  { value: "Ordinary", label: "عادی" },
]

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

function roleLabel(name?: string): string {
  return name ? ROLE_LABELS[name] ?? name : "عادی"
}

function UserCard({
  item,
  scopeNameMap,
  onDelete,
}: {
  item: User
  scopeNameMap: ScopeNameMap
  onDelete: (item: User) => void
}) {
  const fullName = [item.first_name, item.last_name].filter(Boolean).join(" ")
  const orgName = item.organizations?.[0]?.name

  return (
    <div className="glass-card glass-card-hover-active flex h-full flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
            <User className="size-5 text-electric-iris" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <Link
              href={`/admin/users/${item._id}`}
              className="block truncate text-base font-semibold text-moonlight transition-colors hover:text-electric-iris"
            >
              {fullName || "بدون نام"}
            </Link>
            {item.position && (
              <p className="truncate text-xs text-fog/70">{item.position}</p>
            )}
          </div>
        </div>
        <StatusBadge
          status={item.isActive ? "active" : "inactive"}
          label={item.isActive ? "فعال" : "غیرفعال"}
        />
      </div>

      {item.roles && item.roles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.roles.map((role, i) => {
            const scopeName = role.scopeId ? scopeNameMap[role.scopeId] : undefined
            return (
              <Badge key={i} variant="outline" className="gap-1 px-2 py-0.5 text-[11px] font-normal">
                <Shield className="size-3 text-electric-iris" />
                {roleLabel(role.name)}
                {scopeName && <span className="text-fog/60">· {scopeName}</span>}
              </Badge>
            )
          })}
        </div>
      )}

      <div className="mt-auto grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-inset ring-white/[0.06]">
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">سازمان</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6" title={orgName}>
            {orgName || "—"}
          </p>
        </div>
        <div className="min-w-0 bg-[#05060f]/60 p-3 text-center">
          <p className="text-[11px] text-fog/60">موبایل</p>
          <p className="mt-1 truncate text-sm font-medium text-moonlight leading-6" dir="ltr">
            {item.mobile || "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-steel-border/15 pt-3">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-fog/70">
          <CalendarDays className="size-4 text-fog/60" />
          {faDate(item.createdAt)}
        </span>
        <div className="flex items-center gap-1">
          <Link href={`/admin/users/${item._id}`} title="ویرایش">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-moonlight">
              <Pencil className="size-5" />
            </Button>
          </Link>
          <Link href={`/admin/users/${item._id}/roles`} title="نقش‌ها">
            <Button variant="ghost" size="icon-lg" className="size-9 text-fog/60 hover:text-frost-link">
              <Shield className="size-5" />
            </Button>
          </Link>
          <Link href={`/admin/users/${item._id}/relations`} title="روابط">
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

export function UsersClient({
  items,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  search,
  role,
  sort,
  scopeNameMap,
}: UsersClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const makeParams = useCallback(
    (next: { search?: string; role?: string; sort?: string }) => {
      const params = new URLSearchParams()
      const nextSearch = (next.search ?? search).trim()
      const nextRole = next.role ?? role
      const nextSort = next.sort ?? sort
      if (nextSearch) params.set("search", nextSearch)
      if (nextRole) params.set("role", nextRole)
      if (nextSort && nextSort !== "createdAt-desc") params.set("sort", nextSort)
      return params.toString()
    },
    [search, role, sort],
  )

  const go = useCallback(
    (qs: string) => {
      router.push(`/admin/users${qs ? `?${qs}` : ""}`)
    },
    [router],
  )

  const handleSearch = (value: string) => go(makeParams({ search: value }))
  const handleRole = (value: string | null) => go(makeParams({ role: value ?? "" }))
  const handleSort = (value: string | null) => go(makeParams({ sort: value ?? "createdAt-desc" }))
  const handleReset = () => router.push("/admin/users")

  const hasFilters = Boolean(search || role || (sort && sort !== "createdAt-desc"))

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await removeUser({
        activeRoleId: getActiveRoleIdFromStore(),
        _id: deleteTarget._id,
      })
      if (result.success) {
        toast.success("کاربر با موفقیت حذف شد")
        router.refresh()
      } else {
        toast.error(result.body?.message || "خطا در حذف کاربر")
      }
    } catch {
      toast.error("خطا در حذف کاربر")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="کاربران"
        description="مدیریت کاربران سامانه — نقش‌ها، دسترسی‌ها و وضعیت هر کاربر"
      >
        <Link href="/admin/users/add">
          <Button className="gap-2 px-5">
            <Plus className="size-5" />
            افزودن کاربر
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-stretch">
        <SearchField
          value={search}
          onChange={handleSearch}
          placeholder="جستجوی کاربر…"
          ariaLabel="جستجوی کاربر"
          className="w-full lg:min-w-64 lg:max-w-md lg:flex-1"
        />
        <div className="flex flex-wrap items-stretch gap-2.5">
          <FilterSelect
            icon={Shield}
            placeholder="نقش"
            ariaLabel="فیلتر بر اساس نقش"
            value={role}
            onValueChange={handleRole}
            options={roleOptions}
          />
          <FilterSelect
            icon={ArrowDownUp}
            placeholder="مرتب‌سازی"
            ariaLabel="ترتیب نمایش کاربران"
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
            <UserCard key={item._id} item={item} scopeNameMap={scopeNameMap} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={hasFilters ? "کاربری یافت نشد" : "هنوز کاربری ایجاد نشده است"}
          description={
            hasFilters
              ? "با تغییر جستجو یا فیلترها، کاربر موردنظر را پیدا کنید."
              : "اولین کاربر را برای افزودن به سامانه ایجاد کنید."
          }
          action={
            hasFilters ? (
              <Button variant="ghost" className="gap-2 px-4" onClick={handleReset}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Link href="/admin/users/add">
                <Button className="gap-2 px-5">
                  <Plus className="size-5" />
                  ایجاد کاربر
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
        title="حذف کاربر"
        description={`آیا از حذف «${deleteTarget?.first_name || ""} ${deleteTarget?.last_name || ""}» اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
