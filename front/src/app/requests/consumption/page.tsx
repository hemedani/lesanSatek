import Link from "next/link"
import { ArrowRight, Warehouse, Activity } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { NavCard } from "@/components/dashboard/nav-card"
import { gets as getConsumptions } from "@/app/actions/consumption/gets"
import { count as countConsumptions } from "@/app/actions/consumption/count"
import { ConsumptionClient } from "./consumption-client"
import type { ConsumptionRecord, ConsumptionCounts } from "./consumption-client"

const LIMIT = 30
const KPI_LIMIT = 500

const CONSUMPTION_PROJECTION = {
  _id: 1,
  quantity: 1,
  notes: 1,
  reason: 1,
  consumedFor: 1,
  consumedAt: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1, type: 1 },
  consumedBy: { _id: 1, first_name: 1, last_name: 1 },
  inventory: { _id: 1, quantity: 1 },
  ware: { _id: 1, name: 1, brand: 1 },
  wareModel: { _id: 1, name: 1 },
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

export default async function RequestsConsumptionPage({
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
    page,
    limit: LIMIT,
    sortBy,
    sortOrder,
    ...(search ? { consumedFor: search } : {}),
  }

  const [listResult, totalCountResult, filteredCountResult, kpiResult] = await Promise.all([
    getConsumptions(listSet, CONSUMPTION_PROJECTION),
    countConsumptions({}),
    countConsumptions(search ? { consumedFor: search } : {}),
    getConsumptions({ page: 1, limit: KPI_LIMIT, sortBy: "quantity", sortOrder: "desc" }, KPI_PROJECTION),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as ConsumptionRecord[]

  const kpiItems = (kpiResult.success ? kpiResult.body || [] : []) as Pick<ConsumptionRecord, "quantity">[]
  let totalQuantity = 0
  for (const it of kpiItems) {
    if (it.quantity != null) totalQuantity += it.quantity
  }

  const total = totalCountResult.success ? (totalCountResult.body?.qty ?? 0) : kpiItems.length
  const counts: ConsumptionCounts = {
    total,
    totalQuantity,
    averagePerRecord: total > 0 ? Math.round(totalQuantity / total) : 0,
  }

  const filteredTotal = filteredCountResult.success ? (filteredCountResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / LIMIT))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (sort !== "createdAt-desc") params.set("sort", sort)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/requests/consumption?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/requests/consumption?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="مصرف کالا"
        description="ثبت و مشاهده مصرف کالاهای واحد — مقدار، مصرف‌شونده و تاریخ هر رکورد"
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

      <ConsumptionClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        search={search}
        sort={sort}
        counts={counts}
      />
    </div>
  )
}
