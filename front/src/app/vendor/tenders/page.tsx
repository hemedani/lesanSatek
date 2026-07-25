import Link from "next/link"
import { Gavel } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { gets as getTenders } from "@/app/actions/tender/gets"

const statusMap: Record<string, string> = {
  open: "باز",
  closed: "بسته شده",
  awarded: "اعطا شده",
  cancelled: "لغو شده",
}

interface TenderItem {
  _id: string
  title?: string
  deadline?: string
  status?: string
  description?: string
  purchasingRequest?: { _id: string; title?: string }
}

export default async function VendorTendersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getTenders(
    { page, limit },
    {
      _id: 1,
      title: 1,
      deadline: 1,
      status: 1,
      description: 1,
      purchasingRequest: { _id: 1, title: 1 },
    },
  )

  const items: TenderItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/vendor/tenders?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/vendor/tenders?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="مناقصات باز" description="مناقصات قابل شرکت" />

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={Gavel} title="مناقصه‌ای یافت نشد" description="در حال حاضر هیچ مناقصه بازی وجود ندارد" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item._id} className="glass-card glass-card-hover-active rounded-xl p-5 transition-all duration-200 h-full">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Gavel className="size-5 text-violet-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-moonlight leading-6 truncate">
                      {item.title || "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={item.status || "open"} labelMap={statusMap} />
                      {item.purchasingRequest?.title && (
                        <span className="text-xs text-fog/50 truncate">{item.purchasingRequest.title}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-fog/50">
                  {item.deadline && (
                    <span>مهلت: {new Date(item.deadline).toLocaleDateString("fa-IR")}</span>
                  )}
                  <span className="ms-auto">
                    {item.status === "open" ? (
                      <Link href={`/vendor/tenders/${item._id}/offer`}>
                        <Button variant="outline" size="sm">ثبت پیشنهاد</Button>
                      </Link>
                    ) : (
                      <span className="text-fog/40">—</span>
                    )}
                  </span>
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
