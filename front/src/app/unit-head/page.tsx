import Link from "next/link"
import { CheckCircle, Clock, ShoppingCart, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { gets as getApprovals } from "@/app/actions/stepApproval/gets"

export default async function UnitHeadDashboard() {
  const [prsRes, approvalsRes] = await Promise.all([
    getPRs({ page: 1, limit: 1 }, { _id: 1, status: 1 }).catch(() => ({ success: false, body: [] })),
    getApprovals({ page: 1, limit: 1 }, { _id: 1, status: 1 }).catch(() => ({ success: false, body: [] })),
  ])

  const prs = prsRes.success ? prsRes.body || [] : []
  const approvals = approvalsRes.success ? approvalsRes.body || [] : []
  const totalPRs = prs.length
  const pendingApprovals = approvals.filter(
    (a: { status?: string }) => a.status === "pending" || a.status === "در انتظار",
  ).length

  const stats = [
    {
      label: "در انتظار تایید",
      value: pendingApprovals,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      ring: "ring-amber-400/15",
    },
    {
      label: "درخواست‌های فعال",
      value: totalPRs,
      icon: ShoppingCart,
      color: "text-electric-iris",
      bg: "bg-electric-iris/10",
      ring: "ring-electric-iris/15",
    },
    {
      label: "تایید شده",
      value: prs.filter((p: { status?: string }) => p.status === "approved").length,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      ring: "ring-emerald-400/15",
    },
    {
      label: "رد شده",
      value: prs.filter((p: { status?: string }) => p.status === "rejected").length,
      icon: AlertCircle,
      color: "text-ember",
      bg: "bg-ember/10",
      ring: "ring-ember/15",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-glacier">داشبورد پنل واحد</h1>
          <p className="text-sm text-fog mt-1">خلاصه وضعیت درخواست‌های خرید واحد</p>
        </div>
        <Link href="/unit-head/requests">
          <Button variant="outline">مشاهده درخواست‌ها</Button>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg} ${stat.ring} ring-1 ring-inset`}>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="glass">
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-fog tracking-wide">دسترسی سریع</p>
            <CardTitle className="text-base font-medium text-frost-link mt-1">
              عملیات‌های پرکاربرد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/unit-head/requests">
                <Button variant="outline" size="sm">
                  درخواست‌های نیازمند تایید
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-fog tracking-wide">فعالیت اخیر</p>
            <CardTitle className="text-base font-medium text-frost-link mt-1">
              آخرین تصمیم‌گیری‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvals.length > 0 ? (
              <ul className="space-y-2">
                {approvals.slice(0, 5).map((a: { _id: string; status?: string }) => (
                  <li key={a._id} className="flex items-center gap-2 text-sm text-fog py-1">
                    <span className={`size-1.5 rounded-full ${a.status === "approved" ? "bg-emerald-400" : a.status === "rejected" ? "bg-ember" : "bg-amber-400"}`} />
                    {a.status === "approved" ? "تایید" : a.status === "rejected" ? "رد" : "در انتظار"}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fog py-2">هیچ فعالیتی ثبت نشده است</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
