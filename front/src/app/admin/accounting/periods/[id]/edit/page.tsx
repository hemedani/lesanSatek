import { notFound } from "next/navigation"

import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { PeriodForm } from "@/components/accounting/period-form"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import type { AccountingPeriod } from "@/components/accounting/types"
import { get } from "@/app/actions/accountingPeriod/get"
import { gets as getFiscalYears } from "@/app/actions/fiscalYear/gets"

export default async function EditPeriodPage({
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
        <AccountingPageHeader title="ویرایش دوره حسابداری" context={context} />
        <AccountingDenied context={context.allowed ? { ...context, denial: "no-feature" } : context} />
      </div>
    )
  }

  const [periodResult, fiscalYearsResult] = await Promise.all([
    get({ _id: id }, {
      _id: 1,
      code: 1,
      name: 1,
      startDate: 1,
      endDate: 1,
      status: 1,
      fiscalYear: { _id: 1, name: 1 },
    }),
    getFiscalYears({ page: 1, limit: 200, sortBy: "name", sortOrder: "desc" }, { _id: 1, name: 1 }),
  ])

  const period = periodResult.success ? asArray<AccountingPeriod>(periodResult.body)[0] : null
  if (!period) notFound()
  if (period.status !== "open") notFound()
  const fiscalYears = fiscalYearsResult.success
    ? asArray<{ _id: string; name?: string }>(fiscalYearsResult.body)
    : []

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title={`ویرایش دوره ${period.code || ""}`}
        description="تنها نام و بازه زمانی دوره قابل ویرایش است."
        context={context}
      />
      <div className="glass-card rounded-2xl p-5">
        <PeriodForm
          organizationId={context.organizationId}
          fiscalYears={fiscalYears}
          initial={period}
          basePath="/admin/accounting"
          canManage={context.canManage}
        />
      </div>
    </div>
  )
}
