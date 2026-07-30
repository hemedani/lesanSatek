import { PageHeader } from "@/components/ui/page-header"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { RequestsClient } from "./requests-client"
import { ReqType } from "@/types/declarations/selectInp"

interface PRItem {
  _id: string
  title?: string
  quantity?: number
  status?: string
  currentStep?: string
  createdAt?: string
  requester?: { _id: string; first_name?: string; last_name?: string }
  process?: { _id: string; name?: string }
  wareModel?: { _id: string; name?: string }
}

export default async function UnitHeadRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20
  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : undefined

  const result = await getPRs(
    { page, limit, search, status: status as ReqType["main"]["purchasingRequest"]["gets"]["set"]["status"] || undefined },
    {
      _id: 1,
      title: 1,
      quantity: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
      requester: { _id: 1, first_name: 1, last_name: 1 },
      process: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
    },
  )

  const items: PRItem[] = result.success ? result.body || [] : []

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/unit-head/requests?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = items.length >= limit ? `/unit-head/requests?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="همه درخواست‌ها"
        description="لیست کامل درخواست‌های خرید سازمان"
      />
      <RequestsClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        search={search || ""}
        statusFilter={status || ""}
      />
    </div>
  )
}
