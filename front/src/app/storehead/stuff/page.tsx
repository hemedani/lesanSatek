import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { gets } from "@/app/actions/stuff/gets"
import { count } from "@/app/actions/stuff/count"
import { StuffListClient } from "./stuff-list-client"

const VALID_EXPIRY = ["near"]

export default async function StoreStuffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; expiry?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const limit = 20

  const search = typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : ""
  const expiry =
    typeof resolvedSearchParams.expiry === "string" &&
    (VALID_EXPIRY as readonly string[]).includes(resolvedSearchParams.expiry)
      ? resolvedSearchParams.expiry
      : ""

  const listSet = {
    page,
    limit,
    ...(search ? { search } : {}),
    ...(expiry === "near" ? { isExpirationNear: true } : {}),
  }

  const [result, countRes, nearExpiryRes, unitsRes] = await Promise.all([
    gets(
      { activeRoleId: "", ...listSet },
      { _id: 1, quantity: 1, price: 1, expiration: 1, barcode: 1, hasAbsolutePrice: 1, pricePercentage: 1, createdAt: 1, ware: { _id: 1, name: 1, brand: 1 }, store: { _id: 1, name: 1 } },
    ),
    count({ activeRoleId: "" }),
    gets({ activeRoleId: "", isExpirationNear: true, page: 1, limit: 100 }, { _id: 1 }),
    gets({ activeRoleId: "", page: 1, limit: 100 }, { _id: 1, quantity: 1 }),
  ])

  const items = result.success ? result.body || [] : []
  const totalCount = countRes.success && countRes.body ? countRes.body.qty ?? 0 : 0
  const nearExpiryCount = nearExpiryRes.success && nearExpiryRes.body ? nearExpiryRes.body.length : 0
  const totalUnits = unitsRes.success && unitsRes.body
    ? (unitsRes.body as { quantity?: number }[]).reduce((acc: number, s) => acc + (s.quantity ?? 0), 0)
    : 0
  const totalPages = Math.max(1, Math.ceil(totalCount / limit))

  const counts = {
    total: totalCount,
    nearExpiry: nearExpiryCount,
    totalUnits,
  }

  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (expiry) params.set("expiry", expiry)
  const qs = params.toString()

  const prevPageUrl = page > 1 ? `/storehead/stuff?page=${page - 1}${qs ? `&${qs}` : ""}` : ""
  const nextPageUrl = page < totalPages ? `/storehead/stuff?page=${page + 1}${qs ? `&${qs}` : ""}` : ""

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

      <StuffListClient
        items={items}
        prevPageUrl={prevPageUrl}
        nextPageUrl={nextPageUrl}
        page={page}
        totalPages={totalPages}
        search={search}
        expiry={expiry}
        counts={counts}
      />
    </div>
  )
}