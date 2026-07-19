import { FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { gets } from "@/app/actions/tenderOffer/gets"
import { MyOffersClient } from "./my-offers-client"

export default async function MyOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await gets(
    { activeRoleId: "", page, limit },
    {
      _id: 1,
      price: 1,
      status: 1,
      deliveryTime: 1,
      createdAt: 1,
      tender: { _id: 1, title: 1 },
    },
  )

  const items = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/storehead/my-offers?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/storehead/my-offers?page=${page + 1}` : ""

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
        <Card variant="glass">
          <CardContent className="p-0">
            <MyOffersClient items={items} prevPageUrl={prevPageUrl} nextPageUrl={nextPageUrl} page={page} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
