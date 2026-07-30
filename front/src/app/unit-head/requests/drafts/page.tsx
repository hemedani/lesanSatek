import { PageHeader } from "@/components/ui/page-header"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { DraftsClient } from "./drafts-client"

interface DraftItem {
  _id: string
  title?: string
  quantity?: number
  status?: string
  selectionType?: string
  createdAt?: string
  requester?: { _id: string; first_name?: string; last_name?: string }
  wareModel?: { _id: string; name?: string }
}

export default async function DraftsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getPRs(
    { page, limit, status: "Draft" },
    {
      _id: 1,
      title: 1,
      quantity: 1,
      status: 1,
      selectionType: 1,
      createdAt: 1,
      requester: { _id: 1, first_name: 1, last_name: 1 },
      wareModel: { _id: 1, name: 1 },
    },
  )

  const items: DraftItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/unit-head/requests/drafts?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/unit-head/requests/drafts?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader
        title="پیش‌نویس‌ها"
        description="درخواست‌های خرید در وضعیت پیش‌نویس"
      />
      <DraftsClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
      />
    </div>
  )
}
