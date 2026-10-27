"use client"

import { Fragment, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Layers, Pencil, Plus, Sprout, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { AccountingFilters, type AccountingFilterSelect } from "@/components/accounting/accounting-filters"
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_OPTIONS,
  NORMAL_BALANCE_LABELS,
  SYSTEM_KEY_LABELS,
  SYSTEM_KEY_OPTIONS,
  labelOf,
} from "@/components/accounting/labels"
import { resolveAccountingError } from "@/components/accounting/errors"
import type { Account, OrganizationOption } from "@/components/accounting/types"
import { remove } from "@/app/actions/account/remove"
import { seedDefaultChartOfAccounts } from "@/app/actions/account/seedDefaultChartOfAccounts"
import { cn } from "@/lib/utils"

interface AccountsClientProps {
  accounts: Account[]
  basePath: string
  canManage: boolean
  organizations?: OrganizationOption[]
  organizationId?: string
  search: string
  accountType: string
  isActive: string
  systemKey: string
  prevUrl: string
  nextUrl: string
  page: number
  totalPages: number
  total: number
}

function AccountsClient({
  accounts,
  basePath,
  canManage,
  organizations,
  organizationId,
  search,
  accountType,
  isActive,
  systemKey,
  prevUrl,
  nextUrl,
  page,
  totalPages,
  total,
}: AccountsClientProps) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const childrenCount = useMemo(() => {
    const map = new Map<string, number>()
    accounts.forEach((account) => {
      const parentId = account.parentAccount?._id
      if (parentId) map.set(parentId, (map.get(parentId) || 0) + 1)
    })
    return map
  }, [accounts])

  const grouped = useMemo(() => {
    const result = new Map<string, Account[]>()
    accounts.forEach((account) => {
      const type = account.accountType || "other"
      const current = result.get(type) || []
      result.set(type, [...current, account])
    })
    result.forEach((items) =>
      items.sort((a, b) => (a.code || "").localeCompare(b.code || "", "en")),
    )
    return result
  }, [accounts])

  const filters: AccountingFilterSelect[] = [
    {
      key: "accountType",
      placeholder: "نوع حساب",
      value: accountType,
      options: ACCOUNT_TYPE_OPTIONS,
      icon: Layers,
    },
    {
      key: "systemKey",
      placeholder: "کلید سیستمی",
      value: systemKey,
      options: SYSTEM_KEY_OPTIONS,
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
      toast.success("حساب حذف شد")
      setDeleteTarget(null)
      router.refresh()
    } else {
      toast.error(resolveAccountingError(result.body?.message, "خطا در حذف حساب"))
    }
  }

  const handleSeed = async () => {
    if (!organizationId) return
    setSeeding(true)
    const result = await seedDefaultChartOfAccounts({ organizationId })
    setSeeding(false)
    if (result.success) {
      toast.success("کدینگ حساب‌های پیش‌فرض راه‌اندازی شد")
      router.refresh()
    } else {
      toast.error(resolveAccountingError(result.body?.message, "خطا در راه‌اندازی کدینگ حساب‌ها"))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AccountingFilters
          searchValue={search}
          searchPlaceholder="جستجوی کد یا نام حساب…"
          selects={filters}
          organizations={organizations}
          organizationId={organizationId}
        />
        {canManage && (
          <Button render={<Link href={`${basePath}/accounts/new`} />} className="gap-2">
            <Plus className="size-4" />
            حساب جدید
          </Button>
        )}
      </div>

      <p className="text-xs text-fog/50">{total.toLocaleString("fa-IR")} حساب</p>

      {accounts.length === 0 ? (
        <EmptyState
          title="حسابی ثبت نشده است"
          description={
            canManage
              ? "برای شروع، کدینگ حساب‌های پیش‌فرض را راه‌اندازی کنید یا یک حساب جدید بسازید."
              : "برای این سازمان هنوز حسابی تعریف نشده است."
          }
          action={
            canManage && total === 0 ? (
              <Button onClick={handleSeed} disabled={seeding} className="gap-2">
                <Sprout className={cn("size-4", seeding && "animate-pulse")} />
                راه‌اندازی کدینگ پیش‌فرض
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-steel-border/25">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="bg-[#282c35] text-xs text-fog/80">
                <th className="px-3 py-2.5 text-start font-medium">کد</th>
                <th className="px-3 py-2.5 text-start font-medium">نام حساب</th>
                <th className="px-3 py-2.5 text-start font-medium">نوع</th>
                <th className="px-3 py-2.5 text-start font-medium">ماهیت</th>
                <th className="px-3 py-2.5 text-start font-medium">سطح</th>
                <th className="px-3 py-2.5 text-start font-medium">وضعیت</th>
                <th className="px-3 py-2.5 text-start font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {[...grouped.entries()].map(([type, items]) => (
                <Fragment key={type}>
                  <tr className="bg-white/[0.025]">
                    <td colSpan={7} className="px-3 py-2 text-xs font-medium text-frost-link">
                      {ACCOUNT_TYPE_LABELS[type] || "سایر"}
                    </td>
                  </tr>
                  {items.map((account) => {
                    const hasChildren = (childrenCount.get(account._id) || 0) > 0
                    const deleteBlocked = !!account.isSystem || hasChildren
                    return (
                      <tr key={account._id} className="border-t border-steel-border/10 hover:bg-white/[0.02]">
                        <td className="px-3 py-2.5 font-mono text-xs text-fog" dir="ltr">
                          {account.code || "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className={cn("flex items-center gap-2", (account.level || 1) > 1 && "ps-4")}>
                            <span className="text-moonlight">{account.name || "—"}</span>
                            {account.isSystem && (
                              <Badge variant="outline" className="border-electric-iris/25 bg-electric-iris/10 text-electric-iris">
                                سیستمی
                              </Badge>
                            )}
                            {!account.isPostable && (
                              <Badge variant="outline" className="text-fog/70">
                                کل/گروهی
                              </Badge>
                            )}
                            {account.systemKey && (
                              <span className="text-xs text-fog/50">
                                {labelOf(SYSTEM_KEY_LABELS, account.systemKey)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-fog/80">{labelOf(ACCOUNT_TYPE_LABELS, account.accountType)}</td>
                        <td className="px-3 py-2.5 text-fog/80">{labelOf(NORMAL_BALANCE_LABELS, account.normalBalance)}</td>
                        <td className="px-3 py-2.5 text-fog/70">{account.level ?? "—"}</td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={account.isActive === false ? "inactive" : "active"} size="sm" />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            {canManage && (
                              <Button
                                render={<Link href={`${basePath}/accounts/${account._id}/edit`} />}
                                variant="ghost"
                                size="icon"
                                className="size-8 text-fog/60 hover:text-moonlight"
                                aria-label="ویرایش حساب"
                              >
                                <Pencil className="size-4" />
                              </Button>
                            )}
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-fog/60 hover:bg-ember/5 hover:text-ember disabled:opacity-30"
                                onClick={() => setDeleteTarget(account)}
                                disabled={deleteBlocked}
                                title={
                                  deleteBlocked
                                    ? account.isSystem
                                      ? "حساب‌های سیستمی قابل حذف نیستند"
                                      : "ابتدا حساب‌های زیرمجموعه را حذف کنید"
                                    : "حذف حساب"
                                }
                                aria-label="حذف حساب"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination prevUrl={prevUrl} nextUrl={nextUrl} page={page} totalPages={totalPages} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف حساب"
        description={`آیا از حذف حساب «${deleteTarget?.name || ""}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}

export { AccountsClient }
