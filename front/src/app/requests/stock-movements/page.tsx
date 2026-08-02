import Link from "next/link"
import { ArrowRight, Warehouse, ScrollText } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { NavCard } from "@/components/dashboard/nav-card"
import { gets as getStockMovements } from "@/app/actions/stockMovement/gets"
import { count as countStockMovements } from "@/app/actions/stockMovement/count"
import { StockMovementsClient } from "./stock-movements-client"
import type { StockMovement, StockMovementReason, StockMovementCounts } from "./stock-movements-client"

const LIMIT = 30
const KPI_LIMIT = 500

const STOCK_MOVEMENT_PROJECTION = {
  _id: 1,
  quantity: 1,
  balanceBefore: 1,
  balanceAfter: 1,
  reason: 1,
  description: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1, type: 1 },
  createdBy: { _id: 1, first_name: 1, last_name: 1 },
  store: { _id: 1, name: 1 },
  ware: { _id: 1, name: 1, enName: 1, brand: 1 },
  wareModel: { _id: 1, name: 1, enName: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

const KPI_PROJECTION = {
  _id: 1,
  quantity: 1,
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

export default async function RequestsStockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; reason?: string; sort?: string }>
}) {
  const resolvedSearchParams = await searchParams

  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const reason = typeof resolvedSearchParams.reason === "string" ? resolvedSearchParams.reason : ""
  const sort: SortKey = isSortKey(resolvedSearchParams.sort || "") ? resolvedSearchParams.sort as SortKey : "createdAt-desc"
  const { sortBy, sortOrder } = SORT_MAP[sort]

  const listSet = {
    activeRoleId: "",
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(reason ? { reason: reason as StockMovementReason } : {}),
  }

  const [listResult, totalCountResult, filteredCountResult, kpiResult] = await Promise.all([
    getStockMovements(listSet, STOCK_MOVEMENT_PROJECTION),
    countStockMovements({ activeRoleId: "" }),
    countStockMovements(reason ? { activeRoleId: "", reason: reason as StockMovementReason } : { activeRoleId: "" }),
    getStockMovements({ activeRoleId: "", page: 1, limit: KPI_LIMIT, sortBy: "createdAt", sortOrder: "desc" }, KPI_PROJECTION),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as StockMovement[]

  const kpiItems = (kpiResult.success ? kpiResult.body || [] : []) as Pick<StockMovement, "quantity">[]
  let incoming = 0
  let outgoing = 0
  for (const it of kpiItems) {
    if (it.quantity == null) continue
    if (it.quantity > 0) incoming++
    else if (it.quantity < 0) outgoing++
  }

  const total = totalCountResult.success ? (totalCountResult.body?.qty ?? kpiItems.length) : kpiItems.length
  const counts: StockMovementCounts = { total, incoming, outgoing }

  const filteredTotal = filteredCountResult.success
    ? (filteredCountResult.body?.qty ?? items.length)
    : items.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / LIMIT))

  const params = new URLSearchParams()
  if (reason) params.set("reason", reason)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/requests/stock-movements?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/requests/stock-movements?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="گردش کالا"
        description="تاریخچه جابه‌جایی کالا در واحدها — ورود، خروج و دلیل هر حرکت"
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
            href="/requests/inventory"
            title="موجودی انبار"
            description="مشاهده موجودی کالاها"
            icon={Warehouse}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
            footerLabel="رفتن به موجودی انبار"
          />
          <NavCard
            href="/requests/consumption"
            title="مصرف کالا"
            description="ثبت و مشاهده مصرف کالاها"
            icon={ScrollText}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            footerLabel="رفتن به مصرف کالا"
          />
        </div>
      </section>

      <StockMovementsClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        reason={reason}
        sort={sort}
        counts={counts}
      />
    </div>
  )
}
