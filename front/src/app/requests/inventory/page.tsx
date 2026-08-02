import Link from "next/link"
import { ArrowRight, ScrollText, Activity } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { NavCard } from "@/components/dashboard/nav-card"
import { gets as getInventory } from "@/app/actions/inventory/gets"
import { count as countInventory } from "@/app/actions/inventory/count"
import { InventoryClient } from "./inventory-client"
import type { InventoryItem, InventoryCounts } from "./inventory-client"

const LIMIT = 30
const KPI_LIMIT = 500

const INVENTORY_PROJECTION = {
  _id: 1,
  quantity: 1,
  minQuantity: 1,
  maxQuantity: 1,
  batchNo: 1,
  location: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1 },
  warehouseUnit: { _id: 1, name: 1 },
  ware: { _id: 1, name: 1, brand: 1 },
  wareModel: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

const KPI_PROJECTION = {
  _id: 1,
  quantity: 1,
  minQuantity: 1,
} as const

type SortKey = "createdAt-desc" | "createdAt-asc" | "quantity-desc" | "quantity-asc"

const SORT_MAP: Record<SortKey, { sortBy: "createdAt" | "quantity"; sortOrder: "asc" | "desc" }> = {
  "createdAt-desc": { sortBy: "createdAt", sortOrder: "desc" },
  "createdAt-asc": { sortBy: "createdAt", sortOrder: "asc" },
  "quantity-desc": { sortBy: "quantity", sortOrder: "desc" },
  "quantity-asc": { sortBy: "quantity", sortOrder: "asc" },
}

function isSortKey(value: string): value is SortKey {
  return Object.prototype.hasOwnProperty.call(SORT_MAP, value)
}

export default async function EmployeeInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams

  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const sort: SortKey = isSortKey(resolvedSearchParams.sort || "") ? resolvedSearchParams.sort as SortKey : "createdAt-desc"
  const { sortBy, sortOrder } = SORT_MAP[sort]

  const [listResult, countResult, kpiResult] = await Promise.all([
    getInventory(
      { page, limit: LIMIT, sortBy, sortOrder, ...(search ? { search } : {}) },
      INVENTORY_PROJECTION,
    ),
    countInventory({}),
    getInventory({ page: 1, limit: KPI_LIMIT, sortBy: "quantity", sortOrder: "desc" }, KPI_PROJECTION),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as InventoryItem[]

  const kpiItems = (kpiResult.success ? kpiResult.body || [] : []) as Pick<InventoryItem, "quantity" | "minQuantity">[]
  let lowStock = 0
  let totalQuantity = 0
  for (const it of kpiItems) {
    if (it.quantity != null) totalQuantity += it.quantity
    if (it.minQuantity != null && it.quantity != null && it.quantity < it.minQuantity) lowStock++
  }

  const counts: InventoryCounts = {
    total: countResult.success ? (countResult.body?.qty ?? kpiItems.length) : kpiItems.length,
    lowStock,
    totalQuantity,
  }

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/requests/inventory?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = items.length >= LIMIT ? `/requests/inventory?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="موجودی انبار"
        description="موجودی کالاهای واحد شما — مقدار، حداقل و حداکثر، انبار و موقعیت هر قلم"
      >
        <Link href="/requests">
          <Button variant="ghost" className="gap-2 px-4">
            <ArrowRight className="size-5" />
            همه درخواست‌ها
          </Button>
        </Link>
      </PageHeader>

      <section className="space-y-4" aria-label="دسترسی سریع">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          <NavCard
            href="/requests/consumption"
            title="مصرف کالا"
            description="ثبت و مشاهده مصرف کالا"
            icon={ScrollText}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            footerLabel="رفتن به مصرف کالا"
          />
          <NavCard
            href="/requests/stock-movements"
            title="گردش کالا"
            description="تاریخچه جابه‌جایی کالا"
            icon={Activity}
            iconColor="text-sky-400"
            iconBg="bg-sky-400/10"
            footerLabel="رفتن به گردش کالا"
          />
        </div>
      </section>

      <InventoryClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        search={search}
        sort={sort}
        counts={counts}
      />
    </div>
  )
}
