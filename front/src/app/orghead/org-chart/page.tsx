import { getOrgChart } from "@/app/actions/unit/getOrgChart"
import { OrgChartClient } from "./org-chart-client"

export default async function OrgHeadOrgChartPage() {
  const result = await getOrgChart(
    {},
    { units: 1, organization: 1 },
  )

  const items = result.success && result.body?.units ? result.body.units : []
  const organization = result.success ? result.body?.organization ?? null : null

  return <OrgChartClient units={items} organization={organization} />
}
