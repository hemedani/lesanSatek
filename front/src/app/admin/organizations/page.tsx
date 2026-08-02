import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { count as countOrganizations } from "@/app/actions/organization/count"
import { OrganizationsClient } from "./orgs-client"
import type { Organization } from "./orgs-client"

const LIMIT = 20

const ORGANIZATION_PROJECTION = {
  _id: 1,
  name: 1,
  enName: 1,
  description: 1,
  isActive: 1,
  createdAt: 1,
  head: { _id: 1, first_name: 1, last_name: 1 },
  city: { _id: 1, name: 1 },
  state: { _id: 1, name: 1 },
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

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams

  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const sort: SortKey = isSortKey(resolvedSearchParams.sort || "") ? resolvedSearchParams.sort as SortKey : "createdAt-desc"
  const { sortBy, sortOrder } = SORT_MAP[sort]

  const listSet = {
    activeRoleId: "",
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
  }

  const [listResult, countResult] = await Promise.all([
    getOrganizations(listSet, ORGANIZATION_PROJECTION),
    countOrganizations({ activeRoleId: "", ...(search ? { search } : {}) }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as Organization[]
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/organizations?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/organizations?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <OrganizationsClient
      items={items}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      search={search}
      sort={sort}
    />
  )
}
