import { Gavel } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { cookies } from "next/headers"
import { gets } from "@/app/actions/tender/gets"
import { TendersListClient } from "./tenders-list-client"

export default async function StoreTendersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20
  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value || ""

  const result = await gets(
    { activeRoleId, page, limit, status: (resolvedSearchParams.status || "open") as any },
    {
      _id: 1,
      title: 1,
      deadline: 1,
      status: 1,
      description: 1,
      purchasingRequest: { _id: 1, title: 1 },
    },
  )

  const items = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/storehead/tenders?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/storehead/tenders?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="مناقصات" description="مناقصات قابل شرکت" />

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={Gavel} title="مناقصه‌ای یافت نشد" description="در حال حاضر هیچ مناقصه بازی وجود ندارد" />
          </CardContent>
        </Card>
      ) : (
        <Card variant="glass">
          <CardContent className="p-0">
            <TendersListClient items={items} prevPageUrl={prevPageUrl} nextPageUrl={nextPageUrl} page={page} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
