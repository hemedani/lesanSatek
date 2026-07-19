import Link from "next/link"
import { Box, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { gets } from "@/app/actions/stuff/gets"
import { StuffListClient } from "./stuff-list-client"

export default async function StoreStuffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await gets(
    { activeRoleId: "", page, limit, search: resolvedSearchParams.search || undefined },
    { _id: 1, quantity: 1, price: 1, expiration: 1, barcode: 1, hasAbsolutePrice: 1, pricePercentage: 1, createdAt: 1, ware: { _id: 1, name: 1 }, store: { _id: 1, name: 1 } },
  )

  const items = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/storehead/stuff?page=${page - 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : ""
  const nextPageUrl = items.length >= limit ? `/storehead/stuff?page=${page + 1}${resolvedSearchParams.search ? `&search=${resolvedSearchParams.search}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="کالاهای فروشگاه" description="لیست موجودی کالاهای فروشگاه شما">
        <Link href="/storehead/stuff/add">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-4" />
            کالای جدید
          </Button>
        </Link>
      </PageHeader>

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={Box} title="کالایی یافت نشد" description="هنوز هیچ کالایی برای فروشگاه شما ثبت نشده است." />
          </CardContent>
        </Card>
      ) : (
        <Card variant="glass">
          <CardContent className="p-0">
            <StuffListClient items={items} prevPageUrl={prevPageUrl} nextPageUrl={nextPageUrl} page={page} search={resolvedSearchParams.search || ""} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
