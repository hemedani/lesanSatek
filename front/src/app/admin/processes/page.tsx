import { gets as getProcesses } from "@/app/actions/process/gets"
import { count as countProcesses } from "@/app/actions/process/count"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { ProcessesClient } from "./processes-client"
import type { Process, OrgOption } from "./processes-client"

const LIMIT = 20

const PROCESS_PROJECTION = {
  _id: 1,
  name: 1,
  description: 1,
  status: 1,
  version: 1,
  isActive: 1,
  createdAt: 1,
  organization: { _id: 1, name: 1 },
  createdBy: { _id: 1, first_name: 1, last_name: 1 },
  unit: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareModel: { _id: 1, name: 1 },
  ware: { _id: 1, name: 1 },
} as const

type SortKey = "createdAt-desc" | "createdAt-asc" | "name-asc" | "name-desc"

const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "name"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "name-asc": { sortBy: "name", sortOrder: "asc" },
  "name-desc": { sortBy: "name", sortOrder: "desc" },
}

function isSortKey(value: string): value is SortKey {
  return Object.prototype.hasOwnProperty.call(SORT_MAP, value)
}

export default async function ProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string; organization?: string }>
}) {
  const resolvedSearchParams = await searchParams

  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const sort: SortKey = isSortKey(resolvedSearchParams.sort || "")
    ? (resolvedSearchParams.sort as SortKey)
    : "createdAt-desc"
  const organization = typeof resolvedSearchParams.organization === "string" ? resolvedSearchParams.organization : ""
  const { sortBy, sortOrder } = SORT_MAP[sort]

  const listSet = {
    activeRoleId: "",
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(organization ? { organizationId: organization } : {}),
  }

  const [listResult, countResult, orgsResult] = await Promise.all([
    getProcesses(listSet, PROCESS_PROJECTION),
    countProcesses({
      activeRoleId: "",
      ...(search ? { name: search } : {}),
      ...(organization ? { organizationId: organization } : {}),
    }),
    getOrganizations({ activeRoleId: "", page: 1, limit: 100 }, { _id: 1, name: 1 }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as Process[]
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const organizations = (orgsResult.success ? orgsResult.body || [] : []) as OrgOption[]

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  if (organization) params.set("organization", organization)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/processes?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/processes?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <ProcessesClient
      items={items}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      search={search}
      sort={sort}
      organization={organization}
      organizations={organizations}
    />
  )
}
