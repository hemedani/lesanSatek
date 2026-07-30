import { gets } from "@/app/actions/stockMovement/gets"
import { cookies } from "next/headers"
import { getMe } from "@/app/actions/user/getMe"
import { StockMovementsClient } from "./stock-movements-client"

export default async function EmployeeStockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 30

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let unitId: string | undefined

  if (activeRoleId) {
    const userRes = await getMe({
      _id: 1,
      roles: 1,
    }).catch(() => ({ success: false, body: null }))
    const user = userRes.success ? userRes.body : null
    const activeRole = user?.roles?.find((r: { roleId?: string }) => r.roleId === activeRoleId)
    if (activeRole?.scopeType === "unit" && activeRole.scopeId) {
      unitId = activeRole.scopeId
    }
  }

  const result = await gets(
    { activeRoleId: "", unitId, page, limit },
    {
      _id: 1, quantity: 1, balanceBefore: 1, balanceAfter: 1,
      reason: 1, description: 1, createdAt: 1,
      unit: { _id: 1, name: 1, type: 1 },
      createdBy: { _id: 1, first_name: 1, last_name: 1 },
      store: { _id: 1, name: 1 },
      ware: { _id: 1, name: 1, enName: 1, brand: 1 },
      wareModel: { _id: 1, name: 1, enName: 1 },
      wareGroup: { _id: 1, name: 1 },
      wareClass: { _id: 1, name: 1 },
      wareType: { _id: 1, name: 1 },
    }
  )

  const items = result.success ? result.body : []
  const prevPageUrl = page > 1 ? `/requests/stock-movements?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/requests/stock-movements?page=${page + 1}` : ""

  return (
    <StockMovementsClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
    />
  )
}
