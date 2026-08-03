import { gets as getWares } from "@/app/actions/ware/gets"

export interface WareCounts {
  byType: Record<string, number>
  byClass: Record<string, number>
  byGroup: Record<string, number>
  byModel: Record<string, number>
  byManufacturer: Record<string, number>
}

const EMPTY: WareCounts = {
  byType: {},
  byClass: {},
  byGroup: {},
  byModel: {},
  byManufacturer: {},
}

export async function fetchWareCounts(): Promise<WareCounts> {
  try {
    const result = await getWares(
      { activeRoleId: "", page: 1, limit: 1000 },
      {
        _id: 1,
        wareType: { _id: 1 },
        wareClass: { _id: 1 },
        wareGroup: { _id: 1 },
        wareModel: { _id: 1 },
        manufacturer: { _id: 1 },
      }
    )
    if (!result.success || !Array.isArray(result.body)) return EMPTY

    const counts: WareCounts = { byType: {}, byClass: {}, byGroup: {}, byModel: {}, byManufacturer: {} }
    for (const w of result.body) {
      const bump = (key?: string, map?: Record<string, number>) => {
        if (!key || !map) return
        map[key] = (map[key] || 0) + 1
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = w as any
      bump(item.wareType?._id, counts.byType)
      bump(item.wareClass?._id, counts.byClass)
      bump(item.wareGroup?._id, counts.byGroup)
      bump(item.wareModel?._id, counts.byModel)
      bump(item.manufacturer?._id, counts.byManufacturer)
    }
    return counts
  } catch {
    return EMPTY
  }
}
