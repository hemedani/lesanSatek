import Link from "next/link"
import { notFound } from "next/navigation"
import { Gavel, CalendarDays, GitBranch, FileText, Package, Clock, Banknote, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpLauncher } from "@/components/help/help-launcher"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { get as getTender } from "@/app/actions/tender/get"
import { gets as getOffers } from "@/app/actions/tenderOffer/gets"

const TENDER_STATUS_MAP: Record<string, string> = {
  open: "باز",
  closed: "بسته شده",
  awarded: "اعطا شده",
  cancelled: "لغو شده",
}

const OFFER_STATUS_MAP: Record<string, string> = {
  submitted: "در انتظار بررسی",
  accepted: "پذیرفته شده",
  rejected: "رد شده",
}

interface TenderDetail {
  _id: string
  title?: string
  description?: string
  status?: string
  deadline?: string
  purchasingRequest?: { _id?: string; title?: string; estimatedAmount?: number }
}

interface OfferItem {
  _id: string
  price?: number
  deliveryTime?: number
  paymentTerms?: string
  status?: string
  submittedAt?: string
  ware?: { _id?: string; name?: string; brand?: string }
}

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const id = resolvedParams.id

  const [tenderRes, offersRes] = await Promise.all([
    getTender(
      { activeRoleId: "", _id: id },
      {
        _id: 1,
        title: 1,
        description: 1,
        status: 1,
        deadline: 1,
        purchasingRequest: { _id: 1, title: 1, estimatedAmount: 1 },
      },
    ),
    getOffers(
      { activeRoleId: "", tenderId: id, page: 1, limit: 50, sortBy: "submittedAt", sortOrder: "desc" } as unknown as Parameters<typeof getOffers>[0],
      {
        _id: 1,
        price: 1,
        deliveryTime: 1,
        paymentTerms: 1,
        status: 1,
        submittedAt: 1,
        ware: { _id: 1, name: 1, brand: 1 },
      },
    ),
  ])

  const tender = tenderRes.success ? (tenderRes.body?.[0] as TenderDetail | undefined) : undefined
  if (!tender) notFound()

  const offers: OfferItem[] = offersRes.success ? (offersRes.body || []) : []
  const totalOffers = offers.length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-steel-border/30 pb-5 sm:flex-row sm:items-center sm:gap-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/storehead/tenders"
            className="inline-flex shrink-0 items-center justify-center rounded-lg p-1.5 text-fog outline-none transition-colors hover:bg-white/5 hover:text-moonlight focus-visible:ring-2 focus-visible:ring-electric-iris/50"
          >
            <ChevronRight className="size-5 rtl:rotate-180" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-glacier tracking-tight truncate">
              {tender.title || "بدون عنوان"}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge
                status={tender.status || "open"}
                label={TENDER_STATUS_MAP[tender.status || "open"] || tender.status || "باز"}
              />
              {tender.purchasingRequest?.title && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-white/[0.03] border border-steel-border/30 px-2 py-0.5 text-[11px] text-fog/60">
                  <GitBranch className="size-3.5" />
                  {tender.purchasingRequest.title}
                </span>
              )}
            </div>
          </div>
        </div>
        {tender.status === "open" && (
          <Link href={`/storehead/tenders/${id}/offer`}>
            <Button size="sm" className="gap-1.5">
              <Gavel className="size-5" />
              ثبت پیشنهاد
            </Button>
          </Link>
        )}
        <HelpLauncher topicId="storehead-tender-detail" tooltip="راهنمای جزئیات مناقصه" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-inset ring-violet-500/15">
                  <FileText className="size-4.5 text-violet-400" />
                </div>
                <CardTitle>توضیحات مناقصه</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-moonlight/80">
                {tender.description || "توضیحاتی برای این مناقصه ثبت نشده است."}
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                  <Gavel className="size-4.5 text-electric-iris" />
                </div>
                <CardTitle>پیشنهادهای شما برای این مناقصه</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {offers.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="هنوز پیشنهادی ثبت نکرده‌اید"
                  description={
                    tender.status === "open"
                      ? "پیشنهاد خود را برای این مناقصه ثبت کنید"
                      : "برای این مناقصه پیشنهادی ثبت نشده است"
                  }
                  action={
                    tender.status === "open"
                      ? (
                        <Link href={`/storehead/tenders/${id}/offer`}>
                          <Button className="gap-2 px-5">
                            <Gavel className="size-5" />
                            ثبت پیشنهاد
                          </Button>
                        </Link>
                      )
                      : undefined
                  }
                />
              ) : (
                <div className="divide-y divide-steel-border/10">
                  {offers.map((offer) => (
                    <div key={offer._id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-moonlight">
                            <Package className="size-4 text-electric-iris shrink-0" />
                            {offer.ware?.name || "کالا"}
                          </span>
                          {offer.ware?.brand && (
                            <span className="text-[11px] text-fog/50">{offer.ware.brand}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fog/60">
                          <span className="inline-flex items-center gap-1">
                            <Banknote className="size-3.5" />
                            {Number(offer.price || 0).toLocaleString("fa-IR")} ریال
                          </span>
                          {offer.deliveryTime != null && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3.5" />
                              تحویل: {offer.deliveryTime.toLocaleString("fa-IR")} روز
                            </span>
                          )}
                          {offer.submittedAt && (
                            <span>
                              {new Date(offer.submittedAt).toLocaleDateString("fa-IR")}
                            </span>
                          )}
                        </div>
                        {offer.paymentTerms && (
                          <p className="text-[11px] text-fog/40">{offer.paymentTerms}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="shrink-0 bg-white/[0.03] text-fog/70 border-steel-border/40"
                      >
                        {OFFER_STATUS_MAP[offer.status || "submitted"] || offer.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                  <Gavel className="size-4.5 text-electric-iris" />
                </div>
                <CardTitle>اطلاعات مناقصه</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-5">
                <InfoRow
                  icon={CalendarDays}
                  label="مهلت"
                  value={tender.deadline ? new Date(tender.deadline).toLocaleDateString("fa-IR") : "—"}
                />
                <InfoRow
                  icon={GitBranch}
                  label="درخواست مرتبط"
                  value={tender.purchasingRequest?.title || "—"}
                />
                {tender.purchasingRequest?.estimatedAmount != null && (
                  <InfoRow
                    icon={Banknote}
                    label="مبلغ برآوردی"
                    value={`${tender.purchasingRequest.estimatedAmount.toLocaleString("fa-IR")} ریال`}
                  />
                )}
                <InfoRow icon={Package} label="تعداد پیشنهادهای شما" value={totalOffers.toLocaleString("fa-IR")} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-steel-border/20 last:border-b-0">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.03]">
        <Icon className="size-4 text-fog/50" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-fog/50">{label}</p>
        <div className="mt-0.5 text-sm text-moonlight">{value}</div>
      </div>
    </div>
  )
}