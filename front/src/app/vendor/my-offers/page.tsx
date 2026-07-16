import Link from "next/link"
import { FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { gets as getOffers } from "@/app/actions/tenderOffer/gets"

const statusMap: Record<string, string> = {
  pending: "در انتظار بررسی",
  accepted: "پذیرفته شده",
  rejected: "رد شده",
  awarded: "برنده",
}

interface OfferItem {
  _id: string
  price?: number
  status?: string
  deliveryTime?: string
  createdAt?: string
  tender?: { _id: string; title?: string }
}

const columns = [
  {
    key: "tender",
    label: "مناقصه",
    render: (item: OfferItem) => item.tender?.title || "—",
  },
  {
    key: "price",
    label: "قیمت پیشنهادی",
    render: (item: OfferItem) => `${(item.price || 0).toLocaleString("fa-IR")} تومان`,
  },
  { key: "deliveryTime", label: "زمان تحویل", render: (item: OfferItem) => item.deliveryTime || "—" },
  {
    key: "status",
    label: "وضعیت",
    render: (item: OfferItem) => <StatusBadge status={item.status || "pending"} labelMap={statusMap} />,
  },
  {
    key: "createdAt",
    label: "تاریخ ثبت",
    render: (item: OfferItem) =>
      item.createdAt ? new Date(item.createdAt).toLocaleDateString("fa-IR") : "—",
  },
]

export default async function MyOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getOffers(
    { page, limit },
    {
      _id: 1,
      price: 1,
      status: 1,
      deliveryTime: 1,
      createdAt: 1,
      tender: { _id: 1, title: 1 },
    },
  )

  const items: OfferItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/vendor/my-offers?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/vendor/my-offers?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="پیشنهادهای من" description="لیست پیشنهادهای ثبت شده" />

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={FileText} title="پیشنهادی یافت نشد" description="شما هنوز هیچ پیشنهادی ثبت نکرده‌اید" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-fog">{items.length} پیشنهاد</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={columns} data={items} keyExtractor={(item: OfferItem) => item._id} />
            </CardContent>
          </Card>
          <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
        </>
      )}
    </div>
  )
}
