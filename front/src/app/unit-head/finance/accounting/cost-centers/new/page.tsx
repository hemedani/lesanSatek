import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { CostCenterForm } from "@/components/accounting/cost-center-form"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { getUsers } from "@/app/actions/user/getUsers"

export default async function NewCostCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("unit-head", readSearchParam(params.organizationId))

  if (!context.allowed || !context.canManage) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="مرکز هزینه جدید" context={context} />
        <AccountingDenied context={context.allowed ? { ...context, denial: "no-feature" } : context} />
      </div>
    )
  }

  const [unitsResult, usersResult] = await Promise.all([
    getUnits(
      { organizationId: context.organizationId, page: 1, limit: 500, sortBy: "name", sortOrder: "asc" },
      { _id: 1, name: 1 },
    ),
    getUsers({ page: 1, limit: 300, sortBy: "first_name", sortOrder: "asc" }, { _id: 1, first_name: 1, last_name: 1 }),
  ])

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="مرکز هزینه جدید"
        description="یک مرکز هزینه برای تخصیص در ردیف‌های سند بسازید"
        context={context}
      />
      <div className="glass-card rounded-2xl p-5">
        <CostCenterForm
          organizationId={context.organizationId}
          units={unitsResult.success ? asArray<{ _id: string; name?: string }>(unitsResult.body) : []}
          users={usersResult.success ? asArray<{ _id: string; first_name?: string; last_name?: string }>(usersResult.body) : []}
          basePath="/unit-head/finance/accounting"
          canManage={context.canManage}
        />
      </div>
    </div>
  )
}
