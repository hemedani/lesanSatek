"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Workflow, Pencil, Trash2, Target, Clock, CheckCircle2, FileText, Building2, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { FilterBar } from "@/components/ui/filter-bar"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { remove } from "@/app/actions/process/remove"
import { toast } from "sonner"
import { getActiveRoleIdFromStore } from "@/lib/client-active-role"

interface Process {
  _id: string
  name?: string
  description?: string
  status?: string
  version?: number
  isActive?: boolean
  createdAt?: string
  organization?: { _id: string; name?: string }
  unit?: { _id: string; name?: string }
}

const statusConfig: Record<string, { label: string; icon: typeof FileText; color: string; bg: string }> = {
  Draft: { label: "پیش‌نویس", icon: FileText, color: "text-amber-400", bg: "bg-amber-400/10" },
  Active: { label: "فعال", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  Archived: { label: "بایگانی", icon: Clock, color: "text-fog/50", bg: "bg-fog/10" },
}

interface ProcessesClientProps {
  items: Process[]
  prevPageUrl: string
  nextPageUrl: string
  page: number
  search?: string
}

export function ProcessesClient({ items, prevPageUrl, nextPageUrl, page, search = "" }: ProcessesClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Process | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleSearch = (value: string) => {
    if (value.trim()) {
      router.push(`/orghead/processes?search=${encodeURIComponent(value.trim())}`)
    } else {
      router.push("/orghead/processes")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await remove({ activeRoleId: getActiveRoleIdFromStore(), _id: deleteTarget._id })
    if (result.success) {
      toast.success("فرآیند با موفقیت حذف شد")
      router.refresh()
    } else {
      toast.error(result.body?.message || "خطا در حذف فرآیند")
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="فرآیندها" description="مدیریت فرآیندهای خرید سازمان">
        <Link href="/orghead/processes/add">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            فرآیند جدید
          </Button>
        </Link>
      </PageHeader>

      <FilterBar search={search} onSearchChange={handleSearch} searchPlaceholder="جستجوی فرآیند..." />

      <DataTable
        columns={[]}
        data={items}
        keyExtractor={(item) => item._id}
        cardView={true}
        emptyTitle="فرآیندی یافت نشد"
        emptyDescription="هنوز هیچ فرآیندی ایجاد نشده است."
        emptyAction={
          <Link href="/orghead/processes/add">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              ایجاد فرآیند
            </Button>
          </Link>
        }
        renderCard={(item) => {
          const status = statusConfig[item.status || ""] || statusConfig.Draft
          const StatusIcon = status.icon

          return (
            <div className="glass-card glass-card-hover-active rounded-xl overflow-hidden transition-all duration-200">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/[0.04]">
                <div className="size-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-white/[0.06] bg-electric-iris/10">
                  <Workflow className="size-5 text-electric-iris" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orghead/processes/${item._id}`}
                      className="text-sm font-semibold text-moonlight hover:text-electric-iris transition-colors truncate leading-5"
                    >
                      {item.name || "—"}
                    </Link>
                    <span className="text-[10px] text-fog/40 font-mono shrink-0">v{item.version || 1}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1",
                      status.bg,
                    )}>
                      <StatusIcon className={cn("size-3", status.color)} />
                      <span className={status.color}>{status.label}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/orghead/processes/${item._id}`}>
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

              {/* 3-col info row */}
              <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">وضعیت</p>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <StatusIcon className={cn("size-4", status.color)} />
                    <span className={cn("text-xs font-semibold", status.color)}>{status.label}</span>
                  </div>
                </div>
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">حوزه</p>
                  <p className="text-xs font-semibold text-moonlight truncate leading-6">
                    {item.unit?.name || "عمومی"}
                  </p>
                </div>
                <div className="p-3 text-center bg-[#05060f]/60">
                  <p className="text-[10px] text-fog/50">فعالیت</p>
                  <p className={cn(
                    "text-xs font-semibold leading-6",
                    item.isActive ? "text-emerald-400" : "text-rose-400",
                  )}>
                    {item.isActive ? "فعال" : "غیرفعال"}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-4 space-y-1">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">حوزه کاربرد</p>
                      <p className="text-xs text-moonlight truncate">{item.unit?.name || "عمومی"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">سازمان</p>
                      <p className="text-xs text-moonlight truncate">{item.organization?.name || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">تاریخ ایجاد</p>
                      <p className="text-xs text-moonlight">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-fog/30 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-fog/40">نسخه</p>
                      <p className="text-xs text-moonlight font-mono">v{item.version || 1}</p>
                    </div>
                  </div>
                </div>

                {item.description && (
                  <div className="pt-2 mt-2 border-t border-white/[0.04]">
                    <p className="text-[10px] text-fog/40 mb-0.5">توضیحات</p>
                    <p className="text-xs text-fog/70 leading-relaxed line-clamp-2">{item.description}</p>
                  </div>
                )}
              </div>
            </div>
          )
        }}
      />

      <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="حذف فرآیند"
        description={`آیا از حذف "${deleteTarget?.name || 'این فرآیند'}" اطمینان دارید؟ این اقدام قابل بازگشت نیست.`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
