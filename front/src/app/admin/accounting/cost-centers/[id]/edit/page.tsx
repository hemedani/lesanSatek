import { notFound } from "next/navigation"

import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { CostCenterForm } from "@/components/accounting/cost-center-form"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import type { CostCenter } from "@/components/accounting/types"
import { get } from "@/app/actions/costCenter/get"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { getUsers } from "@/app/actions/user/getUsers"

export default async function EditCostCenterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ organizationId?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const context = await resolveAccountingContext("admin", readSearchParam(query.organizationId))

  if (!context.allowed || !context.canManage) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="ویرایش مرکز هزینه" context={context} />
        <AccountingDenied context={context.allowed ? { ...context, denial: "no-feature" } : context} />
      </div>
    )
  }

  const [costCenterResult, unitsResult, usersResult] = await Promise.all([
    get({ _id: id }, {
      _id: 1,
      code: 1,
      name: 1,
      description: 1,
      type: 1,
      isActive: 1,
      unit: { _id: 1, name: 1 },
      responsibleUser: { _id: 1, first_name: 1, last_name: 1 },
    }),
    getUnits(
      { organizationId: context.organizationId, page: 1, limit: 500, sortBy: "name", sortOrder: "asc" },
      { _id: 1, name: 1 },
    ),
    getUsers({ page: 1, limit: 300, sortBy: "first_name", sortOrder: "asc" }, { _id: 1, first_name: 1, last_name: 1 }),
  ])

  const costCenter = costCenterResult.success ? asArray<CostCenter>(costCenterResult.body)[0] : null
  if (!costCenter) notFound()

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="ویرایش مرکز هزینه"
        description={costCenter.name}
        context={context}
      />
      <div className="glass-card rounded-2xl p-5">
        <CostCenterForm
          organizationId={context.organizationId}
          units={unitsResult.success ? asArray<{ _id: string; name?: string }>(unitsResult.body) : []}
          users={usersResult.success ? asArray<{ _id: string; first_name?: string; last_name?: string }>(usersResult.body) : []}
          initial={costCenter}
          basePath="/admin/accounting"
          canManage={context.canManage}
        />
      </div>
    </div>
  )
}
