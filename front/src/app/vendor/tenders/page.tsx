import Link from "next/link"
import { Gavel, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { gets as getTenders } from "@/app/actions/tender/gets"

const statusMap: Record<string, string> = {
  open: "باز",
  closed: "بسته شده",
  awarded: "اعطا شده",
  cancelled: "لغو شده",
}

interface TenderItem {
  _id: string
  title?: string
  deadline?: string
  status?: string
  description?: string
  purchasingRequest?: { _id: string; title?: string }
}

const columns = [
  {
    key: "title",
    label: "عنوان",
    render: (item: TenderItem) => (
      <span className="text-moonlight font-medium">{item.title || "—"}</span>
    ),
  },
  {
    key: "purchasingRequest",
    label: "درخواست خرید",
    render: (item: TenderItem) => item.purchasingRequest?.title || "—",
  },
  {
    key: "deadline",
    label: "مهلت",
    render: (item: TenderItem) =>
      item.deadline ? new Date(item.deadline).toLocaleDateString("fa-IR") : "—",
  },
  {
    key: "status",
    label: "وضعیت",
    render: (item: TenderItem) => <StatusBadge status={item.status || "open"} labelMap={statusMap} />,
  },
  {
    key: "actions",
    label: "عملیات",
    render: (item: TenderItem) =>
      item.status === "open" ? (
        <Link href={`/vendor/tenders/${item._id}/offer`}>
          <Button variant="outline" size="sm">
            ثبت پیشنهاد
          </Button>
        </Link>
      ) : (
        <span className="text-xs text-fog">—</span>
      ),
  },
]

export default async function VendorTendersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getTenders(
    { page, limit },
    {
      _id: 1,
      title: 1,
      deadline: 1,
      status: 1,
      description: 1,
      purchasingRequest: { _id: 1, title: 1 },
    },
  )

  const items: TenderItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/vendor/tenders?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/vendor/tenders?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="مناقصات باز" description="مناقصات قابل شرکت" />

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={Gavel} title="مناقصه‌ای یافت نشد" description="در حال حاضر هیچ مناقصه بازی وجود ندارد" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-fog">{items.length} مناقصه</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={columns} data={items} keyExtractor={(item: TenderItem) => item._id} />
            </CardContent>
          </Card>
          <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
        </>
      )}
    </div>
  )
}
