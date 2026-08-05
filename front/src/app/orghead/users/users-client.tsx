"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, User, Pencil, Trash2, Mail, Phone, Shield, BadgeCheck, BadgeX, Building2, Users as UsersIcon, UserCog, UserCheck, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { DataTable } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { FilterBar } from "@/components/ui/filter-bar"
import { StatCard } from "@/components/dashboard/stat-card"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { removeUser } from "@/app/actions/user/removeUser"
import { toast } from "sonner"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface UserItem {
  _id: string
  first_name?: string
  last_name?: string
  email?: string
  mobile?: string
  isActive?: boolean
  position?: string
  roles?: { roleId?: string; name?: string }[]
}

interface UsersClientProps {
  items: UserItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
  search?: string
  total?: number
  orgHeadCount?: number
  unitHeadCount?: number
  employeeCount?: number
  storeHeadCount?: number
}

const roleLabel: Record<string, string> = {
  Manager: "مدیر",
  Admin: "ادمین",
  OrgHead: "رئیس سازمان",
  UnitHead: "رئیس واحد",
  StoreHead: "سرپرست فروشگاه",
  Employee: "کارمند",
  Ordinary: "عادی",
}

const roleColors: Record<string, string> = {
  Manager: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  Admin: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  OrgHead: "bg-electric-iris/10 text-electric-iris border-electric-iris/20",
  UnitHead: "bg-frost-link/10 text-frost-link border-frost-link/20",
  StoreHead: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Employee: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Ordinary: "bg-fog/10 text-fog border-fog/20",
}

export function UsersClient({ items, prevPageUrl, nextPageUrl, page, search = "", total = 0, orgHeadCount = 0, unitHeadCount = 0, employeeCount = 0, storeHeadCount = 0 }: UsersClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/orghead/users?search=${encodeURIComponent(value.trim())}`)
    } else {
      router.push("/orghead/users")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await removeUser({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id })
    if (result.success) {
      toast.success("کاربر با موفقیت حذف شد")
      router.refresh()
    } else {
      toast.error(result.body?.message || "خطا در حذف کاربر")
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="کاربران" description="مدیریت کاربران سازمان">
        <Link href="/orghead/users/add">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            کاربر جدید
          </Button>
        </Link>
        <HelpLauncher topicId="orghead-users" tooltip="راهنمای کاربران" />
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
        <StatCard
          label="کل کاربران"
          value={total}
          icon={UsersIcon}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
          subtitle="اعضای سازمان"
          onClick={() => router.push("/orghead/users")}
        />
        <StatCard
          label="رؤسای سازمان"
          value={orgHeadCount}
          icon={UserCog}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
          subtitle="نقش رئیس سازمان"
        />
        <StatCard
          label="رؤسای واحد"
          value={unitHeadCount}
          icon={Shield}
          iconColor="text-frost-link"
          iconBg="bg-frost-link/10"
          subtitle="نقش رئیس واحد"
        />
        <StatCard
          label="کارمندان"
          value={employeeCount}
          icon={UserCheck}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
          subtitle="نقش کارمند"
        />
        <StatCard
          label="سرپرستان فروشگاه"
          value={storeHeadCount}
          icon={Store}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-400/10"
          subtitle="نقش سرپرست فروشگاه"
        />
      </div>

      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی کاربر..." />

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {items.map((item) => (
            <div key={item._id} className="glass-card glass-card-hover-active rounded-xl overflow-hidden transition-all duration-200 flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/[0.04]">
                <div className={cn(
                  "size-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06]",
                  item.isActive !== false ? "bg-electric-iris/10" : "bg-fog/10",
                )}>
                  <User className={cn("size-5", item.isActive !== false ? "text-electric-iris" : "text-fog/50")} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orghead/users/${item._id}`}
                      className="text-sm font-semibold text-moonlight hover:text-electric-iris transition-colors truncate leading-5"
                    >
                      {item.first_name || ""} {item.last_name || ""}
                    </Link>
                    {item.isActive !== false ? (
                      <BadgeCheck className="size-4 text-emerald-400 shrink-0" />
                    ) : (
                      <BadgeX className="size-4 text-rose-400 shrink-0" />
                    )}
                  </div>
                  {item.position && (
                    <p className="text-[10px] text-fog/50 truncate leading-4">{item.position}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/orghead/users/${item._id}`}>
                    <Button variant="ghost" size="icon-xs" className="text-fog/60 hover:text-moonlight">
                      <Pencil className="size-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-fog/60 hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* 3-col contact row */}
              <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">ایمیل</p>
                  <p className="text-xs font-semibold text-moonlight truncate leading-6" dir="ltr">
                    {item.email || "—"}
                  </p>
                </div>
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">موبایل</p>
                  <p className="text-xs font-semibold text-moonlight truncate leading-6" dir="ltr">
                    {item.mobile || "—"}
                  </p>
                </div>
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">وضعیت</p>
                  <p className={cn(
                    "text-xs font-semibold leading-6",
                    item.isActive !== false ? "text-emerald-400" : "text-rose-400",
                  )}>
                    {item.isActive !== false ? "فعال" : "غیرفعال"}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-1 mt-auto">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {item.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">ایمیل</p>
                        <p className="text-xs text-moonlight truncate" dir="ltr">{item.email}</p>
                      </div>
                    </div>
                  )}
                  {item.mobile && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">موبایل</p>
                        <p className="text-xs text-moonlight truncate" dir="ltr">{item.mobile}</p>
                      </div>
                    </div>
                  )}
                  {item.position && (
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">سمت</p>
                        <p className="text-xs text-moonlight truncate">{item.position}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Shield className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">نقش‌ها</p>
                      <p className="text-xs text-moonlight truncate">
                        {item.roles?.map((r) => roleLabel[r.name || ""] || r.name).join("، ") || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role badges */}
                {item.roles && item.roles.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 mt-2 border-t border-white/[0.04]">
                    <Shield className="size-3 text-fog/30" />
                    {item.roles.map((role, i) => (
                      <Badge key={i} variant="outline" className={cn(
                        "text-[9px] px-1.5 py-0",
                        roleColors[role.name || ""] || "bg-white/[0.04] text-fog/60",
                      )}>
                        {roleLabel[role.name || ""] || role.name || "—"}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          columns={[]}
          data={items}
          keyExtractor={(item) => item._id}
          cardView={true}
          emptyTitle="کاربری یافت نشد"
          emptyDescription="هنوز هیچ کاربری ایجاد نشده است."
          emptyAction={
            <Link href="/orghead/users/add">
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                ایجاد کاربر
              </Button>
            </Link>
          }
          renderCard={(item) => (
            <div className="glass-card glass-card-hover-active rounded-xl p-4">
              <p className="text-sm font-semibold text-moonlight">{item.first_name || ""} {item.last_name || ""}</p>
            </div>
          )}
        />
      )}

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="حذف کاربر"
        description={`آیا از حذف "${deleteTarget?.first_name || ''} ${deleteTarget?.last_name || ''}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
