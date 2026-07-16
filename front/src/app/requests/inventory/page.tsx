import { gets as getInventory } from "@/app/actions/inventory/gets"
import { cookies } from "next/headers"
import { getUser } from "@/app/actions/user/getUser"
import { InventoryClient } from "./inventory-client"

interface InventoryItem {
  _id: string
  quantity?: number
  minQuantity?: number
  maxQuantity?: number
  batchNo?: string
  location?: string
  createdAt?: string
  unit?: { _id: string; name?: string }
  warehouseUnit?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
  ware?: { _id: string; name?: string }
}

export default async function EmployeeInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 30

  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let unitId: string | undefined

  if (activeRoleId) {
    const userRes = await getUser({}, {
      _id: 1,
      roles: { roleId: 1, scopeId: 1, scopeType: 1, name: 1 },
    }).catch(() => ({ success: false, body: null }))
    const user = userRes.success ? userRes.body : null
    const activeRole = user?.roles?.find((r: { roleId?: string }) => r.roleId === activeRoleId)
    if (activeRole?.scopeType === "unit" && activeRole.scopeId) {
      unitId = activeRole.scopeId
    }
  }

  const result = await getInventory(
    { unitId, page, limit, search: resolvedSearchParams.search || undefined },
    { _id: 1, quantity: 1, minQuantity: 1, maxQuantity: 1, batchNo: 1, location: 1, createdAt: 1, unit: { _id: 1, name: 1 }, warehouseUnit: { _id: 1, name: 1 }, wareModel: { _id: 1, name: 1 }, ware: { _id: 1, name: 1 } },
  )

  const items: InventoryItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/requests/inventory?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : ""
  const nextPageUrl = items.length >= limit ? `/requests/inventory?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : ""

  return (
    <InventoryClient
      items={items}
      prevUrl={prevPageUrl}
      nextUrl={nextPageUrl}
      page={page}
    />
  )
}
