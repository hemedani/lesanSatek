import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { ReportFilters } from "@/components/accounting/report-filters"
import { IncomeStatementReport } from "@/components/accounting/income-statement-report"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import type { AccountingPeriod, IncomeStatement } from "@/components/accounting/types"
import { gets as getPeriods } from "@/app/actions/accountingPeriod/gets"
import { getIncomeStatement } from "@/app/actions/journalEntry/getIncomeStatement"

export default async function IncomeStatementPage({
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
  const context = await resolveAccountingContext("admin", readSearchParam(params.organizationId))

  if (!context.allowed) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="صورت سود و زیان" context={context} />
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
    getIncomeStatement({
      organizationId: context.organizationId,
      ...(periodId ? { periodId } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    }),
  ])

  const periods = periodsResult.success ? asArray<AccountingPeriod>(periodsResult.body) : []
  const report = reportResult.success ? (reportResult.body as IncomeStatement) : null

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="صورت سود و زیان"
        description="درآمدها و هزینه‌های دوره و سود یا زیان خالص"
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
      <IncomeStatementReport data={report} />
    </div>
  )
}
