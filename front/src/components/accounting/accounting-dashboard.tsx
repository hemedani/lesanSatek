"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  BookText,
  CalendarRange,
  ListTree,
  Plus,
  Scale,
  Sprout,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/dashboard/stat-card"
import { NavCard } from "@/components/dashboard/nav-card"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { OrganizationSelector } from "@/components/accounting/organization-selector"
import { JournalEntryTable } from "@/components/accounting/journal-entry-table"
import { formatRial } from "@/components/accounting/money"
import { resolveAccountingError } from "@/components/accounting/errors"
import type { JournalEntry, OrganizationOption } from "@/components/accounting/types"
import { seedDefaultChartOfAccounts } from "@/app/actions/account/seedDefaultChartOfAccounts"

interface AccountingDashboardProps {
  organizationId: string
  organizations: OrganizationOption[]
  basePath: string
  canManage: boolean
  canPostManual: boolean
  accountsCount: number
  totalDebit: number
  totalCredit: number
  netIncome: number
  postedCount: number
  openPeriods: number
  entries: JournalEntry[]
}

function AccountingDashboard({
  organizationId,
  organizations,
  basePath,
  canManage,
  canPostManual,
  accountsCount,
  totalDebit,
  totalCredit,
  netIncome,
  postedCount,
  openPeriods,
  entries,
}: AccountingDashboardProps) {
  const router = useRouter()
  const [seeding, setSeeding] = useState(false)
  const [confirmSeed, setConfirmSeed] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    const result = await seedDefaultChartOfAccounts({ organizationId })
    setSeeding(false)
    setConfirming(false)
    setConfirmSeed(false)
    if (result.success) {
      toast.success("کدینگ حساب‌های پیش‌فرض راه‌اندازی شد")
      router.refresh()
    } else {
      toast.error(resolveAccountingError(result.body?.message, "خطا در راه‌اندازی کدینگ حساب‌ها"))
    }
  }

  const noAccounts = accountsCount === 0

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrganizationSelector organizations={organizations} value={organizationId} />
        {canPostManual && !noAccounts && (
          <Button render={<Link href={`${basePath}/journal-entries/new`} />} className="gap-2">
            <Plus className="size-4" />
            ثبت سند دستی
          </Button>
        )}
      </div>

      {noAccounts && canManage && (
        <div className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl border-electric-iris/25 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/20">
              <Sprout className="size-5 text-electric-iris" />
            </div>
            <div>
              <p className="text-sm font-medium text-moonlight">کدینگ حساب‌های پیش‌فرض را راه‌اندازی کنید</p>
              <p className="mt-1 text-sm text-fog/70">
                برای شروع ثبت اسناد و گزارش‌های حسابداری، حساب‌های پایه سازمان را ایجاد کنید.
              </p>
            </div>
          </div>
          <Button onClick={() => setConfirmSeed(true)} disabled={seeding} className="gap-2">
            <Sprout className={seeding ? "size-4 animate-pulse" : "size-4"} />
            راه‌اندازی کدینگ
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="جمع بدهکار (این ماه)" value={formatRial(totalDebit)} icon={ArrowDownLeft} />
        <StatCard label="جمع بستانکار (این ماه)" value={formatRial(totalCredit)} icon={ArrowUpRight} />
        <StatCard
          label="سود / زیان خالص"
          value={formatRial(netIncome)}
          icon={TrendingUp}
          iconColor={netIncome >= 0 ? "text-cipher-mint" : "text-ember"}
          iconBg={netIncome >= 0 ? "bg-cipher-mint/10" : "bg-ember/10"}
        />
        <StatCard label="اسناد ثبت‌شده" value={postedCount} icon={BookText} />
        <StatCard label="دوره‌های باز" value={openPeriods} icon={CalendarRange} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-moonlight">دسترسی سریع</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NavCard
            href={`${basePath}/accounts`}
            title="کدینگ حساب‌ها"
            description="ساختار حساب‌های سازمان"
            icon={ListTree}
          />
          <NavCard
            href={`${basePath}/journal-entries`}
            title="اسناد حسابداری"
            description="مشاهده و جستجوی اسناد"
            icon={BookText}
          />
          <NavCard
            href={`${basePath}/reports/trial-balance`}
            title="تراز آزمایشی"
            description="کنترل توازن حساب‌ها"
            icon={Scale}
          />
          <NavCard
            href={`${basePath}/periods`}
            title="دوره‌های حسابداری"
            description="مدیریت و بستن دوره‌ها"
            icon={CalendarRange}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-moonlight">آخرین اسناد</h2>
          <Link href={`${basePath}/journal-entries`} className="text-xs text-frost-link hover:text-electric-iris">
            مشاهده همه
          </Link>
        </div>
        {entries.length === 0 ? (
          <EmptyState
            title="سندی ثبت نشده است"
            description={canPostManual ? "اولین سند دستی را ثبت کنید." : "پس از ثبت اسناد، اینجا نمایش داده می‌شوند."}
            action={
              canPostManual && !noAccounts ? (
                <Button render={<Link href={`${basePath}/journal-entries/new`} />} variant="outline" className="gap-2">
                  <BookOpen className="size-4" />
                  ثبت سند دستی
                </Button>
              ) : undefined
            }
          />
        ) : (
          <JournalEntryTable entries={entries} basePath={basePath} />
        )}
      </div>

      <ConfirmDialog
        open={confirmSeed}
        onOpenChange={setConfirmSeed}
        title="راه‌اندازی کدینگ حساب‌های پیش‌فرض"
        description="حساب‌های پایه استاندارد برای این سازمان ایجاد می‌شوند. این عملیات فقط در صورت خالی بودن کدینگ امکان‌پذیر است."
        confirmLabel="راه‌اندازی"
        variant="default"
        onConfirm={() => {
          setConfirming(true)
          handleSeed()
        }}
        loading={confirming || seeding}
      />
    </div>
  )
}

export { AccountingDashboard }
