import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { PeriodForm } from "@/components/accounting/period-form"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import { gets as getFiscalYears } from "@/app/actions/fiscalYear/gets"

export default async function NewPeriodPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("admin", readSearchParam(params.organizationId))

  if (!context.allowed || !context.canManage) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="دوره حسابداری جدید" context={context} />
        <AccountingDenied context={context.allowed ? { ...context, denial: "no-feature" } : context} />
      </div>
    )
  }

  const fiscalYearsResult = await getFiscalYears(
    { page: 1, limit: 200, sortBy: "name", sortOrder: "desc" },
    { _id: 1, name: 1 },
  )
  const fiscalYears = fiscalYearsResult.success
    ? asArray<{ _id: string; name?: string }>(fiscalYearsResult.body)
    : []

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="دوره حسابداری جدید"
        description="بازه زمانی ثبت اسناد را مشخص کنید"
        context={context}
      />
      <div className="glass-card rounded-2xl p-5">
        <PeriodForm
          organizationId={context.organizationId}
          fiscalYears={fiscalYears}
          basePath="/admin/accounting"
          canManage={context.canManage}
        />
      </div>
    </div>
  )
}
