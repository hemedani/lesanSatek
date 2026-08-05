import Link from "next/link"
import { Gavel, FileText, ShoppingCart, Store, Package, Truck, Box, Landmark, Medal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { HelpLauncher } from "@/components/help/help-launcher"
import { NavCard } from "@/components/dashboard/nav-card"
import { count as countStuff } from "@/app/actions/stuff/count"
import { gets as getTenders } from "@/app/actions/tender/gets"
import { gets as getOffers } from "@/app/actions/tenderOffer/gets"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { count as countPRs } from "@/app/actions/purchasingRequest/count"
import { getMe } from "@/app/actions/auth/getMe"
import { RecentPRsClient } from "./recent-prs-client"

const VALID_GRS = ["pending", "none", "completed"]

interface StoreHeadPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function StoreHeadDashboard({ searchParams }: StoreHeadPageProps) {
  const sp = (await searchParams) || {}
  const prSearch = typeof sp.prSearch === "string" ? sp.prSearch : ""
  const prStatus =
    typeof sp.prStatus === "string" && VALID_GRS.includes(sp.prStatus)
      ? sp.prStatus
      : "pending"

  const [me, stuffRes, tendersRes, offersRes, prsRes, pendingDeliveryRes, recentPRsRes] = await Promise.all([
    getMe({ _id: 1, managedStore: { _id: 1, name: 1 } }).catch(() => ({ success: false, body: null })),
    countStuff({ activeRoleId: "" }).catch(() => ({ success: false, body: { qty: 0 } })),
    getTenders({ activeRoleId: "", page: 1, limit: 1, status: "open" }, { _id: 1 }).catch(() => ({ success: false, body: [] })),
    getOffers({ activeRoleId: "", page: 1, limit: 1 }, { _id: 1, status: 1 }).catch(() => ({ success: false, body: [] })),
    countPRs({ activeRoleId: "" }).catch(() => ({ success: false, body: { qty: 0 } })),
    countPRs({ activeRoleId: "", goodsReceiptStatus: "none" } as unknown as Parameters<typeof countPRs>[0]).catch(() => ({ success: false, body: { qty: 0 } })),
    getPRs(
      {
        activeRoleId: "",
        page: 1,
        limit: 6,
        goodsReceiptStatus: prStatus,
        search: prSearch || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      } as unknown as Parameters<typeof getPRs>[0],
      {
        _id: 1,
        title: 1,
        status: 1,
        quantity: 1,
        estimatedAmount: 1,
        stuffStatus: 1,
        createdAt: 1,
        process: { _id: 1, name: 1 },
        requestingUnit: { _id: 1, name: 1 },
        store: { _id: 1, name: 1 },
      } as Parameters<typeof getPRs>[1],
    ).catch(() => ({ success: false, body: [] })),
  ])

  const store = me.success && me.body?.managedStore ? me.body.managedStore : null
  const stuffCount = stuffRes.success && stuffRes.body ? stuffRes.body.qty ?? 0 : 0
  const openTenders = tendersRes.success && tendersRes.body ? tendersRes.body.length : 0
  const myOffers = offersRes.success && offersRes.body ? offersRes.body : []
  const awardedOffers = myOffers.filter((o: { status?: string }) => o.status === "awarded")
  const prCount = prsRes.success && prsRes.body ? prsRes.body.qty ?? 0 : 0

  const pendingDeliveryCount = pendingDeliveryRes.success && pendingDeliveryRes.body ? pendingDeliveryRes.body.qty ?? 0 : 0

  const recentPRs = recentPRsRes.success && Array.isArray(recentPRsRes.body) ? recentPRsRes.body : []

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="داشبورد مدیریت فروشگاه"
        description="خلاصه وضعیت کالاها، مناقصات و درخواست‌های تحویل فروشگاه شما"
      >
        <Link href="/storehead/stuff">
          <Button size="sm" className="gap-1.5">
            <Box className="size-5" />
            مدیریت کالاها
          </Button>
        </Link>
        <HelpLauncher topicId="storehead-dashboard" tooltip="راهنمای داشبورد فروشگاه" />
      </PageHeader>

      {/* Store info banner */}
      {store && (
        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-electric-iris/[0.03] to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                  <Store className="size-6 text-electric-iris" />
                </div>
                <div>
                  <p className="text-sm text-fog/60">فروشگاه شما</p>
                  <p className="text-lg font-semibold text-glacier">{store.name}</p>
                </div>
              </div>
              <Link href="/storehead/store">
                <Button variant="outline" size="sm" className="gap-2">
                  <Store className="size-4" />
                  ویرایش فروشگاه
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI / Nav Cards (quick access) */}
      <section className="space-y-4" aria-label="دسترسی سریع">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <NavCard
            href="/storehead/stuff"
            title="کالاهای فروشگاه"
            description="مدیریت کالا و موجودی فروشگاه"
            value={stuffCount}
            icon={Package}
            iconColor="text-electric-iris"
            iconBg="bg-electric-iris/10"
          />
          <NavCard
            href="/storehead/tenders"
            title="مناقصات باز"
            description="مناقصات جاری و پیشنهاددهی"
            value={openTenders}
            icon={Gavel}
            iconColor="text-frost-link"
            iconBg="bg-frost-link/10"
          />
          <NavCard
            href="/storehead/my-offers"
            title="پیشنهادهای من"
            description="همه پیشنهادهای ثبت‌شده من"
            value={myOffers.length}
            icon={FileText}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
          />
          <NavCard
            href="/storehead/purchasing-requests"
            title="درخواست‌های خرید"
            description="درخواست‌های خرید و تحویل"
            value={prCount}
            icon={ShoppingCart}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
          />
        </div>
      </section>

      {/* Status Stats */}
      <section className="space-y-4" aria-label="وضعیت فروشگاه">
        <div className="flex items-center gap-2">
          <Landmark className="size-5 text-frost-link" />
          <h2 className="text-sm font-medium text-fog tracking-wide">نگاه سریع به وضعیت</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <Link
            href="/storehead/my-offers"
            className="inline-block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Card variant="glass" className="glass-card-hover-active h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <p className="truncate text-body-sm font-medium text-fog/80 leading-6">پیشنهادهای برنده</p>
                    <p className="text-2xl font-semibold tabular-nums text-glacier leading-9">
                      {awardedOffers.length.toLocaleString("fa-IR")}
                    </p>
                    <p className="text-caption text-fog/55 leading-5">پیشنهادهای انتخاب‌شده</p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-inset ring-white/[0.08]">
                    <Medal className="size-5 text-emerald-400" />
                  </div>
                </div>
                <div className="mt-5 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
              </CardContent>
            </Card>
          </Link>
          <Link
            href="/storehead/tenders"
            className="inline-block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Card variant="glass" className="glass-card-hover-active h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <p className="truncate text-body-sm font-medium text-fog/80 leading-6">مناقصات بزرگ‌شده</p>
                    <p className="text-2xl font-semibold tabular-nums text-glacier leading-9">
                      {openTenders.toLocaleString("fa-IR")}
                    </p>
                    <p className="text-caption text-fog/55 leading-5">مناقصات فعال و باز</p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-frost-link/10 ring-1 ring-inset ring-white/[0.08]">
                    <Gavel className="size-5 text-frost-link" />
                  </div>
                </div>
                <div className="mt-5 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
              </CardContent>
            </Card>
          </Link>
          <Link
            href="/storehead/stuff"
            className="inline-block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Card variant="glass" className="glass-card-hover-active h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <p className="truncate text-body-sm font-medium text-fog/80 leading-6">موجودی فروشگاه</p>
                    <p className="text-2xl font-semibold tabular-nums text-glacier leading-9">
                      {stuffCount.toLocaleString("fa-IR")}
                    </p>
                    <p className="text-caption text-fog/55 leading-5">اقلام ثبت‌شده در فروشگاه</p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-electric-iris/10 ring-1 ring-inset ring-white/[0.08]">
                    <Package className="size-5 text-electric-iris" />
                  </div>
                </div>
                <div className="mt-5 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
              </CardContent>
            </Card>
          </Link>
          <Link
            href="/storehead/purchasing-requests"
            className="inline-block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-electric-iris/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Card variant="glass" className="glass-card-hover-active h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <p className="truncate text-body-sm font-medium text-fog/80 leading-6">کل درخواست‌های خرید</p>
                    <p className="text-2xl font-semibold tabular-nums text-glacier leading-9">
                      {prCount.toLocaleString("fa-IR")}
                    </p>
                    <p className="text-caption text-fog/55 leading-5">درخواست‌های مرتبط با فروشگاه</p>
                  </div>
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-inset ring-white/[0.08]">
                    <ShoppingCart className="size-5 text-amber-400" />
                  </div>
                </div>
                <div className="mt-5 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Pending Delivery Alert */}
      {pendingDeliveryCount > 0 && (
        <Link href="/storehead/purchasing-requests?goodsReceiptStatus=none">
          <Card variant="glass" className="cursor-pointer border-amber-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/30 motion-reduce:hover:translate-y-0">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 ring-1 ring-inset ring-amber-500/15">
                  <Truck className="size-6 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-400">درخواست‌های نیازمند تحویل</p>
                  <p className="text-xs text-fog/60 mt-0.5">
                    {pendingDeliveryCount.toLocaleString("fa-IR")} درخواست خرید که هنوز تحویل داده نشده است
                  </p>
                </div>
                <Badge variant="outline" className="text-lg font-semibold text-amber-400 border-amber-500/20 bg-amber-500/10 shrink-0 px-3 py-1">
                  {pendingDeliveryCount.toLocaleString("fa-IR")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/storehead/stuff">
          <Button variant="outline" className="gap-2">
            <Box className="size-4" />
            مدیریت کالاها
          </Button>
        </Link>
        <Link href="/storehead/tenders">
          <Button variant="outline" className="gap-2">
            <Gavel className="size-4" />
            مناقصات باز
          </Button>
        </Link>
        <Link href="/storehead/my-offers">
          <Button variant="outline" className="gap-2">
            <FileText className="size-4" />
            پیشنهادهای من
          </Button>
        </Link>
        <Link href="/storehead/purchasing-requests">
          <Button variant="outline" className="gap-2">
            <ShoppingCart className="size-4" />
            درخواست‌های خرید
          </Button>
        </Link>
        <Link href="/storehead/store">
          <Button variant="outline" className="gap-2">
            <Store className="size-4" />
            ویرایش فروشگاه
          </Button>
        </Link>
      </div>

      {/* Recent PRs needing approval */}
      <RecentPRsClient items={recentPRs} search={prSearch} status={prStatus} />
    </div>
  )
}
