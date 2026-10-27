import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { AccountingDashboard } from "@/components/accounting/accounting-dashboard"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { currentMonthBounds } from "@/components/accounting/money"
import { asArray, readCount } from "@/components/accounting/types"
import type { IncomeStatement, JournalEntry, TrialBalance } from "@/components/accounting/types"
import { count as countAccounts } from "@/app/actions/account/count"
import { count as countEntries } from "@/app/actions/journalEntry/count"
import { gets as getEntries } from "@/app/actions/journalEntry/gets"
import { getIncomeStatement } from "@/app/actions/journalEntry/getIncomeStatement"
import { getTrialBalance } from "@/app/actions/journalEntry/getTrialBalance"
import { gets as getPeriods } from "@/app/actions/accountingPeriod/gets"

const BASE_PATH = "/unit-head/finance/accounting"

export default async function AccountingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("unit-head", readSearchParam(params.organizationId))

  if (!context.allowed) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader
          title="داشبورد حسابداری"
          description="نمای کلی وضعیت حسابداری سازمان"
          context={context}
        />
        <AccountingDenied context={context} />
      </div>
    )
  }

  const { startDate, endDate } = currentMonthBounds()
  const organizationId = context.organizationId

  const [accountsCountResult, entriesResult, postedCountResult, periodsResult, trialResult, incomeResult] =
    await Promise.all([
      countAccounts({ organizationId }),
      getEntries(
        {
          organizationId,
          startDate,
          endDate,
          page: 1,
          limit: 6,
          sortBy: "entryDate",
          sortOrder: "desc",
        },
        {
          _id: 1,
          entryNumber: 1,
          entryDate: 1,
          description: 1,
          reference: 1,
          sourceType: 1,
          status: 1,
          totalDebit: 1,
          totalCredit: 1,
          isBalanced: 1,
        },
      ),
      countEntries({ organizationId, status: "posted", startDate, endDate }),
      getPeriods({ organizationId, status: "open", page: 1, limit: 100 }, { _id: 1 }),
      getTrialBalance({ organizationId, startDate, endDate }),
      getIncomeStatement({ organizationId, startDate, endDate }),
    ])

  const accountsCount = accountsCountResult.success ? readCount(accountsCountResult.body) : 0
  const entries = entriesResult.success ? asArray<JournalEntry>(entriesResult.body) : []
  const postedCount = postedCountResult.success ? readCount(postedCountResult.body) : 0
  const openPeriods = periodsResult.success ? asArray(periodsResult.body).length : 0
  const trial = trialResult.success ? (trialResult.body as TrialBalance) : null
  const income = incomeResult.success ? (incomeResult.body as IncomeStatement) : null

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="داشبورد حسابداری"
        description="نمای کلی وضعیت حسابداری سازمان در ماه جاری"
        context={context}
      />
      <AccountingDashboard
        organizationId={organizationId}
        organizations={context.organizations}
        basePath={BASE_PATH}
        canManage={context.canManage}
        canPostManual={context.canPostManual}
        accountsCount={accountsCount}
        totalDebit={trial?.totals?.debit || 0}
        totalCredit={trial?.totals?.credit || 0}
        netIncome={income?.netIncome || 0}
        postedCount={postedCount}
        openPeriods={openPeriods}
        entries={entries}
      />
    </div>
  )
}
