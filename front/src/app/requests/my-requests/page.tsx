import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { MyRequestsClient } from "./my-requests-client"

interface PRItem {
  _id: string
  title?: string
  estimatedAmount?: number
  quantity?: number
  status?: string
  currentStep?: string
  createdAt?: string
}

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getPRs(
    { page, limit },
    {
      _id: 1,
      title: 1,
      estimatedAmount: 1,
      quantity: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
    },
  )

  const items: PRItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/requests/my-requests?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/requests/my-requests?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <Link
        href="/requests"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>

      <PageHeader
        title="درخواست‌های من"
        description="لیست درخواست‌های خرید ثبت شده"
      />

      <MyRequestsClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
      />
    </div>
  )
}
