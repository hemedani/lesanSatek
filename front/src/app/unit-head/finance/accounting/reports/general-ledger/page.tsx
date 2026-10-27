import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { ReportFilters } from "@/components/accounting/report-filters"
import { GeneralLedgerReport } from "@/components/accounting/general-ledger-report"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import type { Account, AccountingPeriod, GeneralLedger } from "@/components/accounting/types"
import { gets as getAccounts } from "@/app/actions/account/gets"
import { gets as getPeriods } from "@/app/actions/accountingPeriod/gets"
import { getGeneralLedger } from "@/app/actions/journalEntry/getGeneralLedger"

export default async function GeneralLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{
    organizationId?: string
    periodId?: string
    startDate?: string
    endDate?: string
    accountId?: string
  }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("unit-head", readSearchParam(params.organizationId))

  if (!context.allowed) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="دفتر کل" context={context} />
        <AccountingDenied context={context} />
      </div>
    )
  }

  const periodId = readSearchParam(params.periodId)
  const startDate = readSearchParam(params.startDate)
  const endDate = readSearchParam(params.endDate)
  const accountId = readSearchParam(params.accountId)

  const [periodsResult, accountsResult] = await Promise.all([
    getPeriods(
      { organizationId: context.organizationId, page: 1, limit: 200, sortBy: "code", sortOrder: "desc" },
      { _id: 1, code: 1, name: 1, status: 1 },
    ),
    getAccounts(
      { organizationId: context.organizationId, page: 1, limit: 1000, sortBy: "code", sortOrder: "asc" },
      { _id: 1, code: 1, name: 1, accountType: 1, normalBalance: 1, isActive: 1 },
    ),
  ])

  const periods = periodsResult.success ? asArray<AccountingPeriod>(periodsResult.body) : []
  const accounts = accountsResult.success ? asArray<Account>(accountsResult.body) : []

  const reportResult = accountId
    ? await getGeneralLedger({
        accountId,
        ...(periodId ? { periodId } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      })
    : null
  const report = reportResult?.success ? (reportResult.body as GeneralLedger) : null

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="دفتر کل"
        description="گردش و مانده یک حساب همراه با مانده ابتدا و انتهای دوره"
        context={context}
      />
      <ReportFilters
        organizations={context.organizations}
        organizationId={context.organizationId}
        periods={periods}
        periodId={periodId}
        startDate={startDate}
        endDate={endDate}
        accounts={accounts}
        accountId={accountId}
        showAccount
      />
      <GeneralLedgerReport data={report} basePath="/unit-head/finance/accounting" />
    </div>
  )
}
