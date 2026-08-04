import { gets } from "@/app/actions/process/gets"
import { count } from "@/app/actions/process/count"
import { ProcessesClient } from "./processes-client"

export default async function OrgHeadProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await gets(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    {
      _id: 1,
      name: 1,
      description: 1,
      status: 1,
      version: 1,
      isActive: 1,
      createdAt: 1,
      unit: { _id: 1, name: 1 },
      organization: { _id: 1, name: 1 },
      createdBy: { _id: 1, first_name: 1, last_name: 1 },
      wareType: { _id: 1, name: 1 },
      wareClass: { _id: 1, name: 1 },
      wareGroup: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
      ware: { _id: 1, name: 1 },
    },
  )

  const [totalResult, activeResult, draftResult, archivedResult] = await Promise.all([
    count({}, { qty: 1 }),
    count({ status: "Active" }, { qty: 1 }),
    count({ status: "Draft" }, { qty: 1 }),
    count({ status: "Archived" }, { qty: 1 }),
  ])

  const items = result.success ? result.body : []
  const total = totalResult.success ? (totalResult.body?.qty ?? 0) : 0
  const activeCount = activeResult.success ? (activeResult.body?.qty ?? 0) : 0
  const draftCount = draftResult.success ? (draftResult.body?.qty ?? 0) : 0
  const archivedCount = archivedResult.success ? (archivedResult.body?.qty ?? 0) : 0
  const prevPageUrl = page > 1 ? `/orghead/processes?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : ""
  const nextPageUrl = items.length >= limit ? `/orghead/processes?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : ""

  return (
    <ProcessesClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
      total={total}
      activeCount={activeCount}
      draftCount={draftCount}
      archivedCount={archivedCount}
    />
  )
}
