import Link from "next/link"
import { FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { gets as getOffers } from "@/app/actions/tenderOffer/gets"

const statusMap: Record<string, string> = {
  pending: "در انتظار بررسی",
  accepted: "پذیرفته شده",
  rejected: "رد شده",
  awarded: "برنده",
}

interface OfferItem {
  _id: string
  price?: number
  status?: string
  deliveryTime?: string
  createdAt?: string
  tender?: { _id: string; title?: string }
}

export default async function MyOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getOffers(
    { page, limit },
    {
      _id: 1,
      price: 1,
      status: 1,
      deliveryTime: 1,
      createdAt: 1,
      tender: { _id: 1, title: 1 },
    },
  )

  const items: OfferItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/vendor/my-offers?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/vendor/my-offers?page=${page + 1}` : ""

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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item._id} className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 h-full">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="size-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-moonlight leading-6 truncate">
                      {item.tender?.title || "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={item.status || "pending"} labelMap={statusMap} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-fog/50">
                  {item.price != null && (
                    <span>{item.price.toLocaleString("fa-IR")} تومان</span>
                  )}
                  {item.deliveryTime && (
                    <span>تحویل: {item.deliveryTime}</span>
                  )}
                  {item.createdAt && (
                    <span className="ms-auto">{new Date(item.createdAt).toLocaleDateString("fa-IR")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
        </>
      )}
    </div>
  )
}
