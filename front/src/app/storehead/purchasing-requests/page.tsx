import { ShoppingCart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { gets } from "@/app/actions/purchasingRequest/gets"
import { PRListClient } from "./pr-list-client"

export default async function StorePurchasingRequestsPage({
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
      title: 1,
      status: 1,
      quantity: 1,
      estimatedAmount: 1,
      stuffStatus: 1,
      createdAt: 1,
      process: { _id: 1, name: 1 },
      store: { _id: 1, name: 1 },
    },
  )

  const items = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/storehead/purchasing-requests?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/storehead/purchasing-requests?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="درخواست‌های خرید" description="درخواست‌های خرید تخصیص داده شده به فروشگاه شما" />

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={ShoppingCart} title="درخواستی یافت نشد" description="هیچ درخواست خریدی به فروشگاه شما تخصیص داده نشده است." />
          </CardContent>
        </Card>
      ) : (
        <Card variant="glass">
          <CardContent className="p-0">
            <PRListClient items={items} prevPageUrl={prevPageUrl} nextPageUrl={nextPageUrl} page={page} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
