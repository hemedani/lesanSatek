import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { gets as getStockMovements } from "@/app/actions/stockMovement/gets"
import { count } from "@/app/actions/stockMovement/count"
import { StockMovementsClient } from "./stock-movements-client"
import type { StockMovement } from "./stock-movements-client"

const LIMIT = 30

const PROJECTION = {
  _id: 1,
  quantity: 1,
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

export default async function OrgHeadStockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)

  const [listResult, countResult] = await Promise.all([
    getStockMovements({ page, limit: LIMIT, sortBy: "createdAt", sortOrder: "desc" }, PROJECTION),
    count({ activeRoleId: "" }),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as StockMovement[]
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  let inboundQty = 0
  let outboundQty = 0
  let totalQty = 0
  for (const it of items) {
    const qty = it.quantity || 0
    totalQty += qty
    if (qty > 0) inboundQty += qty
    else outboundQty += Math.abs(qty)
  }

  const prevPageUrl = page > 1 ? `/orghead/stock-movements?page=${page - 1}` : ""
  const nextPageUrl = page < totalPages ? `/orghead/stock-movements?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/orghead" className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors">
          <ArrowRight className="size-4" />
          بازگشت به داشبورد
        </Link>
        <HelpLauncher topicId="orghead-stock-movements" tooltip="راهنمای گردش کالا" />
      </div>
      <PageHeader title="گردش کالا" description="مشاهده تاریخچه جابه‌جایی کالا در سطح سازمان" />
      <StockMovementsClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        counts={{ total, inboundQty, outboundQty, totalQty }}
      />
    </div>
  )
}