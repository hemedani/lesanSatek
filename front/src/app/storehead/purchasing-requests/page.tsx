import { PageHeader } from "@/components/ui/page-header"
import { gets } from "@/app/actions/purchasingRequest/gets"
import { count } from "@/app/actions/purchasingRequest/count"
import { PRListClient } from "./pr-list-client"

export default async function StorePurchasingRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined
  const stuffStatus = typeof resolvedSearchParams.stuffStatus === "string" ? resolvedSearchParams.stuffStatus : undefined
  const goodsReceiptStatus = typeof resolvedSearchParams.goodsReceiptStatus === "string" ? resolvedSearchParams.goodsReceiptStatus : undefined
  const paymentOrderStatus = typeof resolvedSearchParams.paymentOrderStatus === "string" ? resolvedSearchParams.paymentOrderStatus : undefined
  const sortBy = typeof resolvedSearchParams.sortBy === "string" ? resolvedSearchParams.sortBy : undefined
  const sortOrder = typeof resolvedSearchParams.sortOrder === "string" ? resolvedSearchParams.sortOrder : undefined

  const filterParams = {
    search,
    stuffStatus: stuffStatus as any,
    goodsReceiptStatus: goodsReceiptStatus as any,
    paymentOrderStatus: paymentOrderStatus as any,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
  }

  const [result, countResult] = await Promise.all([
    gets(
      { activeRoleId: "", page, limit, ...filterParams },
      {
        _id: 1,
        title: 1,
        status: 1,
        quantity: 1,
        estimatedAmount: 1,
        stuffStatus: 1,
        createdAt: 1,
        process: { _id: 1, name: 1 },
        store: { _id: 1, name: 1 },
        paymentOrders: { _id: 1, status: 1, amount: 1 },
      },
    ),
    count({ activeRoleId: "", ...filterParams }),
  ])

  const items = result.success ? result.body || [] : []
  const total = countResult.success && countResult.body ? countResult.body.qty ?? 0 : 0
  const totalPages = Math.ceil(total / limit)

  const buildUrl = (p: number) => {
    const params = new URLSearchParams()
    if (p > 1) params.set("page", String(p))
    if (search) params.set("search", search)
    if (stuffStatus) params.set("stuffStatus", stuffStatus)
    if (goodsReceiptStatus) params.set("goodsReceiptStatus", goodsReceiptStatus)
    if (paymentOrderStatus) params.set("paymentOrderStatus", paymentOrderStatus)
    if (sortBy) params.set("sortBy", sortBy)
    if (sortOrder) params.set("sortOrder", sortOrder)
    const qs = params.toString()
    return `/storehead/purchasing-requests${qs ? `?${qs}` : ""}`
  }

  const prevPageUrl = page > 1 ? buildUrl(page - 1) : ""
  const nextPageUrl = page < totalPages ? buildUrl(page + 1) : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title={goodsReceiptStatus === "none" ? "درخواست‌های نیازمند تحویل" : "درخواست‌های خرید"}
        description={goodsReceiptStatus === "none" ? "درخواست‌هایی که هنوز تحویل داده نشده‌اند" : "درخواست‌های خرید تخصیص داده شده به فروشگاه شما"}
      />

      <PRListClient
        items={items}
        prevPageUrl={prevPageUrl}
        nextPageUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        search={search || ""}
        stuffStatusFilter={stuffStatus || ""}
        goodsReceiptStatusFilter={goodsReceiptStatus || ""}
        paymentOrderStatusFilter={paymentOrderStatus || ""}
        sortBy={sortBy || ""}
        sortOrder={sortOrder || ""}
      />
    </div>
  )
}
