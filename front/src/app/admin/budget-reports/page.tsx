import { cookies } from "next/headers"
import { gets as getFiscalYears } from "@/app/actions/fiscalYear/gets"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { getBudgetReport } from "@/app/actions/budgetLine/getBudgetReport"
import { getYearEndReport } from "@/app/actions/budgetLine/getYearEndReport"
import { BudgetReportsClient } from "./budget-reports-client"
import type { BudgetReportLine, YearEndSummary } from "./budget-reports-client"

export default async function BudgetReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ fiscalYearId?: string; organizationId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const fiscalYearId = typeof resolvedSearchParams.fiscalYearId === "string" ? resolvedSearchParams.fiscalYearId : ""
  const organizationId = typeof resolvedSearchParams.organizationId === "string" ? resolvedSearchParams.organizationId : ""

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value || ""

  const reportSet: { activeRoleId: string; fiscalYearId: string; organizationId?: string } = {
    activeRoleId,
    fiscalYearId,
  }
  if (organizationId) reportSet.organizationId = organizationId

  const [fiscalYearsResult, organizationsResult, budgetResult, yearEndResult] = await Promise.all([
    getFiscalYears({ activeRoleId, page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }, { _id: 1, name: 1 }),
    getOrganizations({ activeRoleId, page: 1, limit: 100, sortBy: "name", sortOrder: "asc" }, { _id: 1, name: 1 }),
    fiscalYearId ? getBudgetReport(reportSet) : Promise.resolve({ success: false, body: null }),
    fiscalYearId ? getYearEndReport(reportSet) : Promise.resolve({ success: false, body: null }),
  ])

  const fiscalYears = (fiscalYearsResult.success ? fiscalYearsResult.body || [] : []) as { _id: string; name?: string }[]
  const organizations = (organizationsResult.success ? organizationsResult.body || [] : []) as { _id: string; name?: string }[]

  const budgetLines = (budgetResult.success ? budgetResult.body || [] : []) as BudgetReportLine[]
  const yearEnd = (yearEndResult.success ? yearEndResult.body : null) as
    | { lines: BudgetReportLine[]; summary: YearEndSummary }
    | null

  const fiscalYearName = fiscalYears.find((fy) => fy._id === fiscalYearId)?.name || ""

  return (
    <BudgetReportsClient
      fiscalYears={fiscalYears}
      organizations={organizations}
      fiscalYearId={fiscalYearId}
      organizationId={organizationId}
      fiscalYearName={fiscalYearName}
      budgetLines={budgetLines}
      yearEnd={yearEnd}
    />
  )
}