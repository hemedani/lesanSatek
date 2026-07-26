import { dashboardStatistic } from "@/app/actions/user/dashboardStatistic"
import { get as getUnit } from "@/app/actions/unit/get"
import { gets as getFiscalYears } from "@/app/actions/fiscalYear/gets"
import { NewBudgetLineForm } from "./form"

export default async function NewBudgetLinePage() {
  const dsRes = await dashboardStatistic(
    { type: "unitHead" },
    { unit: 1 },
  )
  const unit = dsRes.success ? dsRes.body?.unit : null
  const unitId = unit?._id

  let orgId = ""
  if (unitId) {
    const unitRes = await getUnit(
      { _id: unitId },
      { organization: { _id: 1 } },
    )
    if (unitRes.success && unitRes.body?.[0]?.organization?._id) {
      orgId = unitRes.body[0].organization._id
    }
  }

  const fyRes = await getFiscalYears(
    { page: 1, limit: 200 },
    { _id: 1, name: 1, status: 1 },
  )
  const fiscalYears: { _id: string; name?: string }[] = fyRes.success ? fyRes.body || [] : []

  return (
    <div className="space-y-6 relative">
      <div className="relative z-[1]">
        <div className="pb-4 border-b border-steel-border/50">
          <h1 className="text-xl font-semibold text-moonlight tracking-tight">ردیف بودجه جدید</h1>
          <p className="text-sm text-fog/60 mt-1">ایجاد ردیف بودجه جدید</p>
        </div>
      </div>
      <NewBudgetLineForm organizationId={orgId} fiscalYears={fiscalYears} />
    </div>
  )
}
