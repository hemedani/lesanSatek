import { getUsers } from "@/app/actions/user/getUsers"
import { countUsers } from "@/app/actions/user/countUsers"
import { UsersClient } from "./users-client"

export default async function OrgHeadUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getUsers(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    {
      _id: 1,
      first_name: 1,
      last_name: 1,
      email: 1,
      mobile: 1,
      isActive: 1,
      position: 1,
      roles: 1,
    },
  )

  const [totalResult, orgHeadResult, unitHeadResult, employeeResult, storeHeadResult] = await Promise.all([
    countUsers({}, { qty: 1 }),
    countUsers({ roles: ["OrgHead"] }, { qty: 1 }),
    countUsers({ roles: ["UnitHead"] }, { qty: 1 }),
    countUsers({ roles: ["Employee"] }, { qty: 1 }),
    countUsers({ roles: ["StoreHead"] }, { qty: 1 }),
  ])

  const items = result.success ? result.body : []
  const total = totalResult.success ? (totalResult.body?.qty ?? 0) : 0
  const orgHeadCount = orgHeadResult.success ? (orgHeadResult.body?.qty ?? 0) : 0
  const unitHeadCount = unitHeadResult.success ? (unitHeadResult.body?.qty ?? 0) : 0
  const employeeCount = employeeResult.success ? (employeeResult.body?.qty ?? 0) : 0
  const storeHeadCount = storeHeadResult.success ? (storeHeadResult.body?.qty ?? 0) : 0
  const prevPageUrl = page > 1 ? `/orghead/users?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : ""
  const nextPageUrl = items.length >= limit ? `/orghead/users?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : ""

  return (
    <UsersClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      search={resolvedSearchParams.search || ""}
      total={total}
      orgHeadCount={orgHeadCount}
      unitHeadCount={unitHeadCount}
      employeeCount={employeeCount}
      storeHeadCount={storeHeadCount}
    />
  )
}
