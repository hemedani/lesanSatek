import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { getMe } from "@/app/actions/user/getMe"
import { cookies } from "next/headers"
import { MyRequestsClient } from "./my-requests-client"

interface PRItem {
  _id: string
  title?: string
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
  const tab = typeof resolvedSearchParams.tab === "string" ? resolvedSearchParams.tab : undefined

  let query: Record<string, unknown> = { page, limit }

  if (tab === "receipt") {
    const cookieStore = await cookies()
    const activeRoleId = cookieStore.get("activeRoleId")?.value
    if (activeRoleId) {
      const userRes = await getMe({
        _id: 1,
        roles: 1,
      }).catch(() => ({ success: false, body: null }))
      const user = userRes.success ? userRes.body : null
      if (user?._id) {
        query = { page, limit, requesterId: user._id, stuffStatus: "delivered" }
      }
    }
  }

  const result = await getPRs(
    query as any,
    {
      _id: 1,
      title: 1,
      quantity: 1,
      status: 1,
      currentStep: 1,
      createdAt: 1,
    },
  )

  const items: PRItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/requests/my-requests?page=${page - 1}${tab ? `&tab=${tab}` : ""}` : ""
  const nextPageUrl = items.length >= limit ? `/requests/my-requests?page=${page + 1}${tab ? `&tab=${tab}` : ""}` : ""

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
        title={tab === "receipt" ? "کالاهای آماده تحویل" : "درخواست‌های من"}
        description={tab === "receipt" ? "درخواست‌هایی که کالای آنها آماده تحویل است" : "لیست درخواست‌های خرید ثبت شده"}
      />

      <MyRequestsClient
        items={items}
        prevUrl={prevPageUrl}
        nextUrl={nextPageUrl}
        page={page}
        tab={tab}
      />
    </div>
  )
}
