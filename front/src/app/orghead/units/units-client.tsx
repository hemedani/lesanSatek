"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, GitBranch, Pencil, Trash2, User, Building2, Tag, CheckCircle2, XCircle, Layers, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"
import { FilterBar } from "@/components/ui/filter-bar"
import { StatCard } from "@/components/dashboard/stat-card"
import { DataTable } from "@/components/ui/data-table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { remove } from "@/app/actions/unit/remove"
import { toast } from "sonner"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface UnitItem {
  _id: string
  name?: string
  type?: string
  isActive?: boolean
  description?: string
  parentUnit?: { _id: string; name?: string }
  head?: { _id: string; first_name?: string; last_name?: string }
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

const typeColors: Record<string, string> = {
  General: "bg-electric-iris/10 text-electric-iris border-electric-iris/20",
  Warehouse: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Logistics: "bg-frost-link/10 text-frost-link border-frost-link/20",
  Production: "bg-ember/10 text-ember border-ember/20",
  Administration: "bg-fog/10 text-fog border-fog/20",
  Finance: "bg-amber-400/10 text-amber-400 border-amber-400/20",
  Expert: "bg-purple-500/10 text-purple-400 border-purple-500/20",
}

interface UnitsClientProps {
  items: UnitItem[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
  search?: string
  total?: number
  active?: number
}

export function UnitsClient({ items, prevPageUrl, nextPageUrl, page, search = "", total = 0, active = 0 }: UnitsClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<UnitItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/orghead/units?search=${encodeURIComponent(value.trim())}`)
    } else {
      router.push("/orghead/units")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id })
    if (result.success) {
      toast.success("واحد با موفقیت حذف شد")
      router.refresh()
    } else {
      toast.error(result.body?.message || "خطا در حذف واحد")
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="واحدها" description="مدیریت واحدها و زیرواحدهای سازمان">
        <Link href="/orghead/units/add">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            واحد جدید
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
        <StatCard
          label="کل واحدها"
          value={total}
          icon={Layers}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
          subtitle="ساختار سازمان"
          onClick={() => router.push("/orghead/units")}
        />
        <StatCard
          label="واحدهای فعال"
          value={active}
          icon={CheckCircle2}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-400/10"
          subtitle="در حال فعالیت"
        />
        <StatCard
          label="غیرفعال"
          value={Math.max(total - active, 0)}
          icon={XCircle}
          iconColor="text-ember"
          iconBg="bg-ember/10"
          subtitle="متوقف شده"
        />
        <StatCard
          label="دارای سرپرست"
          value={items.filter((i) => i.head).length}
          icon={Users}
          iconColor="text-frost-link"
          iconBg="bg-frost-link/10"
          subtitle="در این صفحه"
        />
        <StatCard
          label="زیرواحدها"
          value={items.filter((i) => i.parentUnit).length}
          icon={GitBranch}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
          subtitle="واحدهای فرزند"
        />
      </div>

      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی واحد..." />

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
                  <GitBranch className={cn("size-5", item.isActive !== false ? "text-electric-iris" : "text-fog/50")} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orghead/units/${item._id}`}
                      className="text-sm font-semibold text-moonlight hover:text-electric-iris transition-colors truncate leading-5"
                    >
                      {item.name || "—"}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full border",
                      typeColors[item.type || ""] || "bg-white/[0.04] text-fog/60 border-steel-border/20",
                    )}>
                      {typeLabels[item.type || ""] || item.type || "—"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/orghead/units/${item._id}`}>
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

              {/* 3-col status row */}
              <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">وضعیت</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    {item.isActive !== false ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : (
                      <XCircle className="size-4 text-rose-400" />
                    )}
                    <span className={cn(
                      "text-xs font-semibold",
                      item.isActive !== false ? "text-emerald-400" : "text-rose-400",
                    )}>
                      {item.isActive !== false ? "فعال" : "غیرفعال"}
                    </span>
                  </div>
                </div>
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">سرپرست</p>
                  <p className="text-xs font-semibold text-moonlight truncate leading-6">
                    {item.head ? (
                      <span className="flex items-center justify-center gap-1">
                        <User className="size-3.5 text-fog/50 shrink-0" />
                        {item.head.first_name} {item.head.last_name}
                      </span>
                    ) : "—"}
                  </p>
                </div>
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">واحد والد</p>
                  <p className="text-xs font-semibold text-moonlight truncate leading-6">
                    {item.parentUnit?.name || "—"}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-1 mt-auto">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">نوع واحد</p>
                      <p className="text-xs text-moonlight truncate">{typeLabels[item.type || ""] || item.type || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">والد</p>
                      <p className="text-xs text-moonlight truncate">{item.parentUnit?.name || "ندارد"}</p>
                    </div>
                  </div>
                  {item.head && (
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-fog/30 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-fog/40">سرپرست</p>
                        <p className="text-xs text-moonlight truncate">{item.head.first_name} {item.head.last_name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={cn("size-3.5 shrink-0", item.isActive !== false ? "text-emerald-400/50" : "text-rose-400/50")} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">فعالیت</p>
                      <p className="text-xs text-moonlight">{item.isActive !== false ? "فعال" : "غیرفعال"}</p>
                    </div>
                  </div>
                </div>

                {item.description && (
                  <div className="pt-2 mt-2 border-t border-white/[0.04]">
                    <p className="text-[10px] text-fog/40 mb-0.5">توضیحات</p>
                    <p className="text-xs text-fog/70 leading-relaxed">{item.description}</p>
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
          emptyTitle="واحدی یافت نشد"
          emptyDescription="هنوز هیچ واحدی ایجاد نشده است."
          emptyAction={
            <Link href="/orghead/units/add">
              <Button size="sm" className="gap-1.5">
                <Plus className="size-4" />
                ایجاد واحد
              </Button>
            </Link>
          }
          renderCard={(item) => (
            <div className="glass-card glass-card-hover-active rounded-xl p-4">
              <p className="text-sm font-semibold text-moonlight">{item.name || "—"}</p>
            </div>
          )}
        />
      )}

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="حذف واحد"
        description={`آیا از حذف "${deleteTarget?.name || 'این واحد'}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
