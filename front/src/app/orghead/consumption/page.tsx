import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { gets } from "@/app/actions/consumption/gets"
import { count } from "@/app/actions/consumption/count"
import { ConsumptionClient } from "./consumption-client"
import type { ConsumptionRecord, ConsumptionCounts } from "./consumption-client"

const LIMIT = 30

const PROJECTION = {
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
  ware: { _id: 1, name: 1, enName: 1, brand: 1 },
  wareModel: { _id: 1, name: 1, enName: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
}

export default async function OrgHeadConsumptionPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)

  const [listResult, countResult] = await Promise.all([
    gets({ page, limit: LIMIT, sortBy: "consumedAt", sortOrder: "desc" }, PROJECTION),
    count({}),
  ])

  const items = (listResult.success ? listResult.body || [] : []) as ConsumptionRecord[]
  const total = countResult.success ? (countResult.body?.qty ?? items.length) : items.length
  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  const counts: ConsumptionCounts = { total }

  const prevPageUrl = page > 1 ? `/orghead/consumption?page=${page - 1}` : ""
  const nextPageUrl = page < totalPages ? `/orghead/consumption?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/orghead" className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors">
          <ArrowRight className="size-4" />
          بازگشت به داشبورد
        </Link>
      </div>
      <PageHeader title="مصرف کالا" description="مشاهده مصرف کالا در سطح سازمان" />
      <ConsumptionClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        counts={counts}
      />
    </div>
  )
}