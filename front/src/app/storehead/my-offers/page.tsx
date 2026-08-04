import { PageHeader } from "@/components/ui/page-header"
import { gets } from "@/app/actions/tenderOffer/gets"
import { MyOffersClient } from "./my-offers-client"

const VALID_STATUSES = ["submitted", "accepted", "rejected", "awarded"]

export default async function MyOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; sort?: string }>
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
  const sort: "asc" | "desc" = resolvedSearchParams.sort === "asc" ? "asc" : "desc"

  const listSet = {
    page,
    limit,
    sortBy: "submittedAt" as const,
    sortOrder: sort,
    ...(search ? { search } : {}),
    ...(status ? { status: status as "submitted" | "accepted" | "rejected" } : {}),
  }

  const [result, submittedRes, acceptedRes, awardedRes] = await Promise.all([
    gets(
      { activeRoleId: "", ...listSet },
      {
        _id: 1,
        price: 1,
        status: 1,
        deliveryTime: 1,
        submittedAt: 1,
        createdAt: 1,
        tender: { _id: 1, title: 1 },
        ware: { _id: 1, name: 1, brand: 1 },
      },
    ),
    gets({ activeRoleId: "", page: 1, limit: 100, status: "submitted" }, { _id: 1 }),
    gets({ activeRoleId: "", page: 1, limit: 100, status: "accepted" }, { _id: 1 }),
    gets({ activeRoleId: "", page: 1, limit: 100, status: "awarded" } as unknown as Parameters<typeof gets>[0], { _id: 1 }),
  ])

  const items = result.success ? result.body || [] : []
  const submittedCount = submittedRes.success && submittedRes.body ? submittedRes.body.length : 0
  const acceptedCount = acceptedRes.success && acceptedRes.body ? acceptedRes.body.length : 0
  const awardedCount = awardedRes.success && awardedRes.body ? awardedRes.body.length : 0

  const counts = {
    total: items.length,
    submitted: submittedCount,
    accepted: acceptedCount,
    awarded: awardedCount,
  }

  const totalPages = Math.max(1, Math.ceil((items.length || 1) / limit))

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  if (sort === "asc") params.set("sort", "asc")
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/storehead/my-offers?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = items.length >= limit ? `/storehead/my-offers?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="پیشنهادهای من" description="لیست پیشنهادهای ثبت شده برای مناقصات" />

      <MyOffersClient
        items={items}
        prevPageUrl={prevPageUrl}
        nextPageUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        search={search}
        status={status}
        sort={sort}
        counts={counts}
      />
    </div>
  )
}