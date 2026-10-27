import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { JournalEntryForm } from "@/components/accounting/journal-entry-form"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import type { Account, CostCenter } from "@/components/accounting/types"
import { gets as getAccounts } from "@/app/actions/account/gets"
import { gets as getCostCenters } from "@/app/actions/costCenter/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"

export default async function NewJournalEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("unit-head", readSearchParam(params.organizationId))

  if (!context.allowed || !context.canPostManual) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="ثبت سند دستی" context={context} />
        <AccountingDenied context={context.allowed ? { ...context, denial: "no-feature" } : context} />
      </div>
    )
  }

  const organizationId = context.organizationId
  const [accountsResult, costCentersResult, unitsResult] = await Promise.all([
    getAccounts(
      { organizationId, isActive: true, page: 1, limit: 1000, sortBy: "code", sortOrder: "asc" },
      {
        _id: 1,
        code: 1,
        name: 1,
        accountType: 1,
        normalBalance: 1,
        isPostable: 1,
        isActive: 1,
      },
    ),
    getCostCenters(
      { organizationId, isActive: true, page: 1, limit: 500, sortBy: "code", sortOrder: "asc" },
      { _id: 1, code: 1, name: 1 },
    ),
    getUnits(
      { organizationId, page: 1, limit: 500, sortBy: "name", sortOrder: "asc" },
      { _id: 1, name: 1 },
    ),
  ])

  const accounts = accountsResult.success ? asArray<Account>(accountsResult.body) : []
  const costCenters = costCentersResult.success ? asArray<CostCenter>(costCentersResult.body) : []
  const units = unitsResult.success ? asArray<{ _id: string; name?: string }>(unitsResult.body) : []

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="ثبت سند دستی"
        description="سند باید حداقل دو ردیف و جمع بدهکار و بستانکار برابر داشته باشد."
        context={context}
      />
      <div className="glass-card rounded-2xl p-5">
        <JournalEntryForm
          organizationId={organizationId}
          accounts={accounts}
          costCenters={costCenters}
          units={units}
          basePath="/unit-head/finance/accounting"
          canPostManual={context.canPostManual}
        />
      </div>
    </div>
  )
}
