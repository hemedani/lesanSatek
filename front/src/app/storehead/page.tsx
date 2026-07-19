import Link from "next/link"
import { Box, Gavel, FileText, ShoppingCart, Store, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { count as countStuff } from "@/app/actions/stuff/count"
import { gets as getTenders } from "@/app/actions/tender/gets"
import { gets as getOffers } from "@/app/actions/tenderOffer/gets"
import { count as countPRs } from "@/app/actions/purchasingRequest/count"
import { getMe } from "@/app/actions/auth/getMe"

export default async function StoreHeadDashboard() {
  const [me, stuffRes, tendersRes, offersRes, prsRes] = await Promise.all([
    getMe({ _id: 1, managedStore: { _id: 1, name: 1 } }).catch(() => ({ success: false, body: null })),
    countStuff({ activeRoleId: "" }).catch(() => ({ success: false, body: { qty: 0 } })),
    getTenders({ activeRoleId: "", page: 1, limit: 1, status: "open" }, { _id: 1 }).catch(() => ({ success: false, body: [] })),
    getOffers({ activeRoleId: "", page: 1, limit: 1 }, { _id: 1, status: 1 }).catch(() => ({ success: false, body: [] })),
    countPRs({ activeRoleId: "" }).catch(() => ({ success: false, body: { qty: 0 } })),
  ])

  const store = me.success && me.body?.managedStore ? me.body.managedStore : null
  const stuffCount = stuffRes.success && stuffRes.body ? stuffRes.body.qty ?? 0 : 0
  const openTenders = tendersRes.success && tendersRes.body ? tendersRes.body.length : 0
  const myOffers = offersRes.success && offersRes.body ? offersRes.body : []
  const awardedOffers = myOffers.filter((o: { status?: string }) => o.status === "awarded")
  const prCount = prsRes.success && prsRes.body ? prsRes.body.qty ?? 0 : 0

  const stats = [
    {
      label: "کالاهای فروشگاه",
      value: stuffCount,
      icon: Package,
      color: "text-electric-iris",
      bg: "bg-electric-iris/10",
      href: "/storehead/stuff",
    },
    {
      label: "مناقصات باز",
      value: openTenders,
      icon: Gavel,
      color: "text-frost-link",
      bg: "bg-frost-link/10",
      href: "/storehead/tenders",
    },
    {
      label: "پیشنهادهای من",
      value: myOffers.length,
      icon: FileText,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      href: "/storehead/my-offers",
    },
    {
      label: "درخواست‌های خرید",
      value: prCount,
      icon: ShoppingCart,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      href: "/storehead/purchasing-requests",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Store info banner */}
      {store && (
        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-electric-iris/[0.03] to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                <Store className="size-6 text-electric-iris" />
              </div>
              <div>
                <p className="text-sm text-fog/60">فروشگاه شما</p>
                <p className="text-lg font-semibold text-glacier">{store.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg} ring-1 ring-inset`}>
                      <Icon className={`size-5 ${stat.color}`} />
                    </div>
                    <CardTitle className="text-sm font-medium text-fog leading-5">
                      {stat.label}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-glacier leading-8">{stat.value}</p>
                  <div className="mt-4 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

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
    </div>
  )
}
