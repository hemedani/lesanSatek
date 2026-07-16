import Link from "next/link"
import { Receipt } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { gets as getPaymentOrders } from "@/app/actions/paymentOrder/gets"

const statusMap: Record<string, string> = {
  pending: "در انتظار پرداخت",
  paid: "پرداخت شده",
  cancelled: "لغو شده",
}

interface PaymentOrderItem {
  _id: string
  amount?: number
  status?: string
  createdAt?: string
  purchasingRequest?: { _id: string; title?: string }
  description?: string
}

const columns = [
  {
    key: "purchasingRequest",
    label: "درخواست خرید",
    render: (item: PaymentOrderItem) =>
      item.purchasingRequest?.title || "—",
  },
  {
    key: "amount",
    label: "مبلغ",
    render: (item: PaymentOrderItem) => `${(item.amount || 0).toLocaleString("fa-IR")} تومان`,
  },
  {
    key: "status",
    label: "وضعیت",
    render: (item: PaymentOrderItem) => (
      <StatusBadge status={item.status || "pending"} labelMap={statusMap} />
    ),
  },
  { key: "description", label: "توضیحات", render: (item: PaymentOrderItem) => item.description || "—" },
  {
    key: "createdAt",
    label: "تاریخ",
    render: (item: PaymentOrderItem) =>
      item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—",
  },
]

export default async function FinancePaymentOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getPaymentOrders(
    { page, limit },
    {
      _id: 1,
      amount: 1,
      status: 1,
      createdAt: 1,
      description: 1,
      purchasingRequest: { _id: 1, title: 1 },
    },
  )

  const items: PaymentOrderItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/finance/payment-orders?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/finance/payment-orders?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="دستورات پرداخت" description="مشاهده دستورات پرداخت" />

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={Receipt} title="دستور پرداختی یافت نشد" description="هیچ دستور پرداختی ثبت نشده است" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-fog">{items.length} دستور</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={columns} data={items} keyExtractor={(item: PaymentOrderItem) => item._id} />
            </CardContent>
          </Card>
          <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
        </>
      )}
    </div>
  )
}
