import { getUsers } from "@/app/actions/user/getUsers"
import { countUsers } from "@/app/actions/user/countUsers"
import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { gets as getUnits } from "@/app/actions/unit/gets"
import { UsersClient } from "./users-client"
import type { User, ScopeNameMap } from "./users-client"

const LIMIT = 20

const USER_PROJECTION = {
  _id: 1,
  first_name: 1,
  last_name: 1,
  email: 1,
  mobile: 1,
  isActive: 1,
  position: 1,
  createdAt: 1,
  roles: 1,
  organizations: { _id: 1, name: 1 },
} as const

type UserRoleName = "Manager" | "Admin" | "OrgHead" | "UnitHead" | "StoreHead" | "Employee" | "Ordinary"

type SortKey = "createdAt-desc" | "createdAt-asc" | "name-asc" | "name-desc"

const ROLE_NAMES: UserRoleName[] = ["Manager", "Admin", "OrgHead", "UnitHead", "StoreHead", "Employee", "Ordinary"]

function isRoleName(value: string): value is UserRoleName {
  return (ROLE_NAMES as string[]).includes(value)
}

const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "first_name"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "name-asc": { sortBy: "first_name", sortOrder: "asc" },
  "name-desc": { sortBy: "first_name", sortOrder: "desc" },
}

function isSortKey(value: string): value is SortKey {
  return Object.prototype.hasOwnProperty.call(SORT_MAP, value)
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; role?: string; sort?: string }>
}) {
  const resolved = await searchParams

  const page = Math.max(1, Number(resolved.page) || 1)
  const search = typeof resolved.search === "string" ? resolved.search : ""
  const roleRaw = typeof resolved.role === "string" ? resolved.role : ""
  const role: UserRoleName | "" = isRoleName(roleRaw) ? roleRaw : ""
  const sort: SortKey = isSortKey(resolved.sort || "") ? resolved.sort as SortKey : "createdAt-desc"
  const { sortBy, sortOrder } = SORT_MAP[sort]

  const listSet = {
    activeRoleId: "",
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(search ? { search } : {}),
    ...(role ? { roles: [role] } : {}),
  }

  const [listResult, countResult, orgsResult, unitsResult] = await Promise.all([
    getUsers(listSet, USER_PROJECTION),
    countUsers({ activeRoleId: "", ...(role ? { roles: [role] } : {}) }),
    getOrganizations({ activeRoleId: "", page: 1, limit: 100 }, { _id: 1, name: 1 }),
    getUnits({ activeRoleId: "", page: 1, limit: 100 }, { _id: 1, name: 1 }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as User[]
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const scopeNameMap: ScopeNameMap = {}
  if (orgsResult.success) {
    for (const o of orgsResult.body || []) {
      if (o._id && o.name) scopeNameMap[o._id] = o.name
    }
  }
  if (unitsResult.success) {
    for (const u of unitsResult.body || []) {
      if (u._id && u.name) scopeNameMap[u._id] = u.name
    }
  }

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (role) params.set("role", role)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/admin/users?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/admin/users?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <UsersClient
      items={items}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
      totalPages={totalPages}
      search={search}
      role={role}
      sort={sort}
      scopeNameMap={scopeNameMap}
    />
  )
}
