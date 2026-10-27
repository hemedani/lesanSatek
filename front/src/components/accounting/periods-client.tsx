"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarRange, CheckCircle2, Lock, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AccountingFilters, type AccountingFilterSelect } from "@/components/accounting/accounting-filters"
import { PERIOD_STATUS_LABELS, PERIOD_STATUS_OPTIONS } from "@/components/accounting/labels"
import { formatJalaliDate, formatJalaliDateTime } from "@/components/accounting/money"
import { resolveAccountingError } from "@/components/accounting/errors"
import type {
  AccountingPeriod,
  OrganizationOption,
} from "@/components/accounting/types"
import { closePeriod } from "@/app/actions/accountingPeriod/closePeriod"
import { remove } from "@/app/actions/accountingPeriod/remove"

interface PeriodsClientProps {
  periods: AccountingPeriod[]
  basePath: string
  canManage: boolean
  canClose: boolean
  organizations?: OrganizationOption[]
  organizationId?: string
  search: string
  status: string
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
}

function PeriodsClient({
  periods,
  basePath,
  canManage,
  canClose,
  organizations,
  organizationId,
  search,
  status,
  prevUrl,
  nextUrl,
  page,
  totalPages,
}: PeriodsClientProps) {
  const router = useRouter()
  const [closeTarget, setCloseTarget] = useState<AccountingPeriod | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AccountingPeriod | null>(null)
  const [working, setWorking] = useState(false)

  const filters: AccountingFilterSelect[] = [
    {
      key: "status",
      placeholder: "وضعیت دوره",
      value: status,
      options: PERIOD_STATUS_OPTIONS,
      icon: Lock,
    },
  ]

  const handleClose = async () => {
    if (!closeTarget) return
    setWorking(true)
    const result = await closePeriod({ _id: closeTarget._id })
    setWorking(false)
    if (result.success) {
      toast.success("دوره حسابداری بسته شد")
      setCloseTarget(null)
      router.refresh()
    } else {
      toast.error(resolveAccountingError(result.body?.message, "خطا در بستن دوره"))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setWorking(true)
    const result = await remove({ _id: deleteTarget._id })
    setWorking(false)
    if (result.success) {
      toast.success("دوره حسابداری حذف شد")
      setDeleteTarget(null)
      router.refresh()
    } else {
      toast.error(resolveAccountingError(result.body?.message, "خطا در حذف دوره"))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AccountingFilters
          searchValue={search}
          searchPlaceholder="جستجوی کد یا نام دوره…"
          selects={filters}
          organizations={organizations}
          organizationId={organizationId}
        />
        {canManage && (
          <Button render={<Link href={`${basePath}/periods/new`} />} className="gap-2">
            <Plus className="size-4" />
            دوره جدید
          </Button>
        )}
      </div>

      {periods.length === 0 ? (
        <EmptyState
          title="دوره‌ای ثبت نشده است"
          description="برای ثبت اسناد، ابتدا یک دوره حسابداری بسازید."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-steel-border/25">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-[#282c35] text-xs text-fog/80">
                <th className="px-3 py-2.5 text-start font-medium">کد</th>
                <th className="px-3 py-2.5 text-start font-medium">نام</th>
                <th className="px-3 py-2.5 text-start font-medium">شروع</th>
                <th className="px-3 py-2.5 text-start font-medium">پایان</th>
                <th className="px-3 py-2.5 text-start font-medium">وضعیت</th>
                <th className="px-3 py-2.5 text-start font-medium">بسته‌شده توسط</th>
                <th className="px-3 py-2.5 text-start font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => {
                const isOpen = period.status === "open" || !period.status
                return (
                  <tr key={period._id} className="border-t border-steel-border/10 hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 font-mono text-xs text-fog" dir="ltr">
                      {period.code || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-moonlight">{period.name || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-fog/80">
                      {formatJalaliDate(period.startDate)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-fog/80">
                      {formatJalaliDate(period.endDate)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge
                        status={period.status || "open"}
                        labelMap={PERIOD_STATUS_LABELS}
                        size="sm"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-xs text-fog/70">
                      {period.closedBy
                        ? `${period.closedBy.first_name || ""} ${period.closedBy.last_name || ""}`.trim() || "—"
                        : "—"}
                      {period.closedAt && (
                        <span className="block text-fog/40">{formatJalaliDateTime(period.closedAt)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {canClose && isOpen && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCloseTarget(period)}
                            className="gap-1.5 text-fog/70 hover:text-cipher-mint"
                          >
                            <CheckCircle2 className="size-4" />
                            بستن
                          </Button>
                        )}
                        {canManage && isOpen && (
                          <Button
                            render={<Link href={`${basePath}/periods/${period._id}/edit`} />}
                            variant="ghost"
                            size="icon"
                            className="size-8 text-fog/60 hover:text-moonlight"
                            aria-label="ویرایش دوره"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        {canManage && isOpen && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-fog/60 hover:bg-ember/5 hover:text-ember"
                            onClick={() => setDeleteTarget(period)}
                            aria-label="حذف دوره"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                        {!isOpen && <CalendarRange className="size-4 text-fog/30" />}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination prevUrl={prevUrl} nextUrl={nextUrl} page={page} totalPages={totalPages} />

      <ConfirmDialog
        open={!!closeTarget}
        onOpenChange={(open) => !open && setCloseTarget(null)}
        title="بستن دوره حسابداری"
        description={`آیا از بستن دوره «${closeTarget?.name || ""}» اطمینان دارید؟ پس از بسته شدن امکان ثبت سند در این دوره وجود ندارد.`}
        confirmLabel="بستن دوره"
        variant="default"
        onConfirm={handleClose}
        loading={working}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف دوره حسابداری"
        description={`آیا از حذف دوره «${deleteTarget?.name || ""}» اطمینان دارید؟ فقط دوره‌های باز و بدون سند قابل حذف هستند.`}
        onConfirm={handleDelete}
        loading={working}
      />
    </div>
  )
}

export { PeriodsClient }
