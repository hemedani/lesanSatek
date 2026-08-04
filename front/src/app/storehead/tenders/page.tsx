import { PageHeader } from "@/components/ui/page-header"
import { gets } from "@/app/actions/tender/gets"
import { count } from "@/app/actions/tender/count"
import { TendersListClient } from "./tenders-list-client"

const VALID_STATUSES = ["open", "closed", "awarded", "cancelled"]

export default async function StoreTendersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const limit = 20

  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const status =
    typeof resolvedSearchParams.status === "string" &&
    (VALID_STATUSES as readonly string[]).includes(resolvedSearchParams.status)
      ? resolvedSearchParams.status
      : ""

  const listSet = {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(status ? { status: status as "open" | "closed" | "awarded" | "cancelled" } : {}),
  }

  const [result, totalRes, openRes, awardedRes, closedRes] = await Promise.all([
    gets(
      { activeRoleId: "", ...listSet },
      {
        _id: 1,
        title: 1,
        deadline: 1,
        status: 1,
        description: 1,
        purchasingRequest: { _id: 1, title: 1 },
      },
    ),
    count({ activeRoleId: "" }),
    count({ activeRoleId: "", status: "open" }),
    count({ activeRoleId: "", status: "awarded" }),
    count({ activeRoleId: "", status: "closed" }),
  ])

  const items = result.success ? result.body || [] : []
  const totalCount = totalRes.success && totalRes.body ? totalRes.body.qty ?? 0 : 0
  const totalPages = Math.max(1, Math.ceil(totalCount / limit))

  const counts = {
    total: totalCount,
    open: openRes.success && openRes.body ? openRes.body.qty ?? 0 : 0,
    awarded: awardedRes.success && awardedRes.body ? awardedRes.body.qty ?? 0 : 0,
    closed: closedRes.success && closedRes.body ? closedRes.body.qty ?? 0 : 0,
  }

  const prevPageUrl = page > 1 ? `/storehead/tenders?page=${page - 1}` : ""

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  const qs = params.toString()
  const nextPageUrl = page < totalPages ? `/storehead/tenders?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="مناقصات" description="مناقصات قابل شرکت برای فروشگاه شما" />

      <TendersListClient
        items={items}
        prevPageUrl={prevPageUrl}
        nextPageUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        search={search}
        status={status}
        counts={counts}
      />
    </div>
  )
}