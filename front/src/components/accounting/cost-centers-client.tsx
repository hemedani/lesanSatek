"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Pencil, Plus, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AccountingFilters, type AccountingFilterSelect } from "@/components/accounting/accounting-filters"
import { COST_CENTER_TYPE_LABELS, COST_CENTER_TYPE_OPTIONS, labelOf } from "@/components/accounting/labels"
import { resolveAccountingError } from "@/components/accounting/errors"
import type { CostCenter, OrganizationOption } from "@/components/accounting/types"
import { remove } from "@/app/actions/costCenter/remove"

interface CostCentersClientProps {
  costCenters: CostCenter[]
  basePath: string
  canManage: boolean
  organizations?: OrganizationOption[]
  organizationId?: string
  search: string
  type: string
  isActive: string
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
}

function CostCentersClient({
  costCenters,
  basePath,
  canManage,
  organizations,
  organizationId,
  search,
  type,
  isActive,
  prevUrl,
  nextUrl,
  page,
  totalPages,
}: CostCentersClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<CostCenter | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filters: AccountingFilterSelect[] = [
    {
      key: "type",
      placeholder: "نوع مرکز",
      value: type,
      options: COST_CENTER_TYPE_OPTIONS,
      icon: Building2,
    },
    {
      key: "isActive",
      placeholder: "وضعیت",
      value: isActive,
      options: [
        { value: "true", label: "فعال" },
        { value: "false", label: "غیرفعال" },
      ],
    },
  ]

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const result = await remove({ _id: deleteTarget._id })
    setDeleting(false)
    if (result.success) {
      toast.success("مرکز هزینه حذف شد")
      setDeleteTarget(null)
      router.refresh()
    } else {
      toast.error(resolveAccountingError(result.body?.message, "خطا در حذف مرکز هزینه"))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AccountingFilters
          searchValue={search}
          searchPlaceholder="جستجوی کد یا نام مرکز هزینه…"
          selects={filters}
          organizations={organizations}
          organizationId={organizationId}
        />
        {canManage && (
          <Button render={<Link href={`${basePath}/cost-centers/new`} />} className="gap-2">
            <Plus className="size-4" />
            مرکز هزینه جدید
          </Button>
        )}
      </div>

      {costCenters.length === 0 ? (
        <EmptyState
          title="مرکز هزینه‌ای ثبت نشده است"
          description="برای تخصیص هزینه‌ها، یک مرکز هزینه بسازید."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-steel-border/25">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="bg-[#282c35] text-xs text-fog/80">
                <th className="px-3 py-2.5 text-start font-medium">کد</th>
                <th className="px-3 py-2.5 text-start font-medium">نام</th>
                <th className="px-3 py-2.5 text-start font-medium">نوع</th>
                <th className="px-3 py-2.5 text-start font-medium">واحد</th>
                <th className="px-3 py-2.5 text-start font-medium">مسئول</th>
                <th className="px-3 py-2.5 text-start font-medium">وضعیت</th>
                <th className="px-3 py-2.5 text-start font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {costCenters.map((costCenter) => (
                <tr key={costCenter._id} className="border-t border-steel-border/10 hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 font-mono text-xs text-fog" dir="ltr">
                    {costCenter.code || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block text-moonlight">{costCenter.name || "—"}</span>
                    {costCenter.description && (
                      <span className="block max-w-72 truncate text-xs text-fog/50">
                        {costCenter.description}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-fog/80">
                    {labelOf(COST_CENTER_TYPE_LABELS, costCenter.type)}
                  </td>
                  <td className="px-3 py-2.5 text-fog/80">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-4 text-fog/50" />
                      {costCenter.unit?.name || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-fog/80">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="size-4 text-fog/50" />
                      {costCenter.responsibleUser
                        ? `${costCenter.responsibleUser.first_name || ""} ${costCenter.responsibleUser.last_name || ""}`.trim() || "—"
                        : "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={costCenter.isActive === false ? "inactive" : "active"} size="sm" />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {canManage && (
                        <Button
                          render={<Link href={`${basePath}/cost-centers/${costCenter._id}/edit`} />}
                          variant="ghost"
                          size="icon"
                          className="size-8 text-fog/60 hover:text-moonlight"
                          aria-label="ویرایش مرکز هزینه"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-fog/60 hover:bg-ember/5 hover:text-ember"
                          onClick={() => setDeleteTarget(costCenter)}
                          aria-label="حذف مرکز هزینه"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination prevUrl={prevUrl} nextUrl={nextUrl} page={page} totalPages={totalPages} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف مرکز هزینه"
        description={`آیا از حذف مرکز هزینه «${deleteTarget?.name || ""}» اطمینان دارید؟`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

export { CostCentersClient }
