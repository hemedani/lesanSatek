import Link from "next/link"
import { Gavel, FileText, Award, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { gets as getTenders } from "@/app/actions/tender/gets"
import { gets as getOffers } from "@/app/actions/tenderOffer/gets"

export default async function VendorDashboard() {
  const [tendersRes, offersRes] = await Promise.all([
    getTenders({ page: 1, limit: 1, filter: { status: "open" } }, { _id: 1 }).catch(() => ({ success: false, body: [] })),
    getOffers({ page: 1, limit: 1 }, { _id: 1, status: 1 }).catch(() => ({ success: false, body: [] })),
  ])

  const openTenders = tendersRes.success ? tendersRes.body || [] : []
  const myOffers = offersRes.success ? offersRes.body || [] : []
  const awardedOffers = myOffers.filter((o: { status?: string }) => o.status === "awarded")

  const stats = [
    {
      label: "مناقصات باز",
      value: openTenders.length,
      icon: Gavel,
      color: "text-electric-iris",
      bg: "bg-electric-iris/10",
    },
    {
      label: "پیشنهادهای من",
      value: myOffers.length,
      icon: FileText,
      color: "text-frost-link",
      bg: "bg-frost-link/10",
    },
    {
      label: "برنده شده",
      value: awardedOffers.length,
      icon: Award,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "نرخ برد",
      value: myOffers.length > 0 ? `${Math.round((awardedOffers.length / myOffers.length) * 100)}%` : "—",
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-glacier">پنل فروشندگان</h1>
        <p className="text-sm text-fog mt-1">مدیریت مناقصات و پیشنهادها</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} variant="glass">
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
          )
        })}
      </div>

      <div className="flex gap-3">
        <Link href="/vendor/tenders">
          <Button variant="outline" className="gap-2">
            <Gavel className="size-4" />
            مناقصات باز
          </Button>
        </Link>
        <Link href="/vendor/my-offers">
          <Button variant="outline" className="gap-2">
            <FileText className="size-4" />
            پیشنهادهای من
          </Button>
        </Link>
      </div>
    </div>
  )
}
