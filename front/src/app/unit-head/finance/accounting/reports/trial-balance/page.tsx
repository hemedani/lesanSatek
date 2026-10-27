import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { ReportFilters } from "@/components/accounting/report-filters"
import { TrialBalanceReport } from "@/components/accounting/trial-balance-report"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import type { AccountingPeriod, TrialBalance } from "@/components/accounting/types"
import { gets as getPeriods } from "@/app/actions/accountingPeriod/gets"
import { getTrialBalance } from "@/app/actions/journalEntry/getTrialBalance"

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{
    organizationId?: string
    periodId?: string
    startDate?: string
    endDate?: string
  }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("unit-head", readSearchParam(params.organizationId))

  if (!context.allowed) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="تراز آزمایشی" context={context} />
        <AccountingDenied context={context} />
      </div>
    )
  }

  const periodId = readSearchParam(params.periodId)
  const startDate = readSearchParam(params.startDate)
  const endDate = readSearchParam(params.endDate)

  const [periodsResult, reportResult] = await Promise.all([
    getPeriods(
      { organizationId: context.organizationId, page: 1, limit: 200, sortBy: "code", sortOrder: "desc" },
      { _id: 1, code: 1, name: 1, status: 1 },
    ),
    getTrialBalance({
      organizationId: context.organizationId,
      ...(periodId ? { periodId } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    }),
  ])

  const periods = periodsResult.success ? asArray<AccountingPeriod>(periodsResult.body) : []
  const report = reportResult.success ? (reportResult.body as TrialBalance) : null

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="تراز آزمایشی"
        description="جمع بدهکار و بستانکار حساب‌ها در بازه انتخابی"
        context={context}
      />
      <ReportFilters
        organizations={context.organizations}
        organizationId={context.organizationId}
        periods={periods}
        periodId={periodId}
        startDate={startDate}
        endDate={endDate}
      />
      <TrialBalanceReport data={report} />
    </div>
  )
}
