import Link from "next/link"
import { Clock, CheckCircle, ShoppingCart, Building2, Wallet, Warehouse, ScrollText, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { count } from "@/app/actions/purchasingRequest/count"
import { gets } from "@/app/actions/purchasingRequest/gets"
import { gets as getPaymentOrders } from "@/app/actions/paymentOrder/gets"
import { getMe } from "@/app/actions/auth/getMe"

export default async function OrgHeadDashboard() {
  const [me, pendingRes, completedRes, totalRes, recentPRs, receivedPRs, draftPOs] = await Promise.all([
    getMe({ _id: 1, organizations: { _id: 1, name: 1 }, roles: 1 }).catch(() => ({ success: false, body: null })),
    count({ status: "PendingFinalization" }).catch(() => ({ success: false, body: { qty: 0 } })),
    count({ status: "Completed" }).catch(() => ({ success: false, body: { qty: 0 } })),
    count({}).catch(() => ({ success: false, body: { qty: 0 } })),
    gets(
      { activeRoleId: "", page: 1, limit: 10 },
      { _id: 1, title: 1, status: 1, estimatedAmount: 1, createdAt: 1, requestingUnit: { _id: 1, name: 1 }, wareModel: { _id: 1, name: 1 } }
    ).catch(() => ({ success: false, body: [] })),
    gets(
      { activeRoleId: "", page: 1, limit: 200, stuffStatus: "received" },
      { _id: 1 }
    ).catch(() => ({ success: false, body: [] })),
    getPaymentOrders(
      { activeRoleId: "", page: 1, limit: 200, status: "draft" },
      { _id: 1, purchasingRequest: { _id: 1 } }
    ).catch(() => ({ success: false, body: [] })),
  ])

  const organization = me.success && me.body?.organizations?.[0] ? me.body.organizations[0] : null
  const pendingCount = pendingRes.success ? pendingRes.body?.qty ?? 0 : 0
  const completedCount = completedRes.success ? completedRes.body?.qty ?? 0 : 0
  const totalCount = totalRes.success ? totalRes.body?.qty ?? 0 : 0
  const recentItems = recentPRs.success ? recentPRs.body || [] : []

  const receivedPRsList = receivedPRs.success ? receivedPRs.body || [] : []
  const draftPOList = draftPOs.success ? draftPOs.body || [] : []
  const draftPOByPRId = new Set(
    draftPOList
      .filter((po: any) => po.purchasingRequest?._id)
      .map((po: any) => po.purchasingRequest._id)
  )
  const paymentCount = receivedPRsList.filter((pr: any) => draftPOByPRId.has(pr._id)).length

  const stats = [
    {
      label: "در انتظار تأیید نهایی",
      value: pendingCount,
      icon: Clock,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      href: "/orghead/requests?tab=pending",
    },
    {
      label: "نیازمند پرداخت",
      value: paymentCount,
      icon: Wallet,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      href: "/orghead/requests?tab=payment",
    },
    {
      label: "تکمیل شده",
      value: completedCount,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/orghead/requests?tab=completed",
    },
    {
      label: "کل درخواست‌ها",
      value: totalCount,
      icon: ShoppingCart,
      color: "text-electric-iris",
      bg: "bg-electric-iris/10",
      href: "/orghead/requests",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Org info banner */}
      {organization && (
        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-electric-iris/[0.03] to-transparent pointer-events-none" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-electric-iris/10 flex items-center justify-center shrink-0">
                <Building2 className="size-6 text-electric-iris" />
              </div>
              <div>
                <p className="text-sm text-fog/60">سازمان شما</p>
                <p className="text-lg font-semibold text-glacier">{organization.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg} ring-1 ring-inset ring-white/[0.06]`}>
                      <Icon className={`size-5 ${stat.color}`} />
                    </div>
                    <CardTitle className="text-sm font-medium text-fog leading-5">
                      {stat.label}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-glacier leading-8">
                    {stat.value.toLocaleString("fa-IR")}
                  </p>
                  <div className="mt-4 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/orghead/requests?tab=pending">
          <Button variant="outline" className="gap-2">
            <Clock className="size-4" />
            درخواست‌های در انتظار تأیید
          </Button>
        </Link>
        <Link href="/orghead/requests?tab=payment">
          <Button variant="outline" className="gap-2">
            <Wallet className="size-4" />
            درخواست‌های نیازمند پرداخت
          </Button>
        </Link>
        <Link href="/orghead/requests?tab=completed">
          <Button variant="outline" className="gap-2">
            <CheckCircle className="size-4" />
            درخواست‌های تکمیل شده
          </Button>
        </Link>
        <Link href="/orghead/requests">
          <Button variant="outline" className="gap-2">
            <ShoppingCart className="size-4" />
            همه درخواست‌ها
          </Button>
        </Link>
        <Link href="/orghead/inventory">
          <Button variant="outline" className="gap-2">
            <Warehouse className="size-4" />
            موجودی انبار
          </Button>
        </Link>
        <Link href="/orghead/consumption">
          <Button variant="outline" className="gap-2">
            <ScrollText className="size-4" />
            مصرف کالا
          </Button>
        </Link>
        <Link href="/orghead/stock-movements">
          <Button variant="outline" className="gap-2">
            <Activity className="size-4" />
            گردش کالا
          </Button>
        </Link>
      </div>

      {/* Recent PRs */}
      {recentItems.length > 0 && (
        <Card variant="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-frost-link">
              آخرین درخواست‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentItems.slice(0, 5).map((pr: { _id: string; title?: string; status?: string; requestingUnit?: { name?: string }; estimatedAmount?: number; createdAt?: string }) => (
                <Link
                  key={pr._id}
                  href={`/orghead/requests/${pr._id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-steel-border/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-moonlight truncate">
                      {pr.title || "—"}
                    </p>
                    <p className="text-xs text-fog/50 mt-0.5">
                      {pr.requestingUnit?.name || ""}
                      {pr.estimatedAmount != null && ` · ${pr.estimatedAmount.toLocaleString("fa-IR")} ریال`}
                    </p>
                  </div>
                  <div className="text-xs text-fog/40 shrink-0 me-3">
                    {pr.createdAt ? new Date(pr.createdAt).toLocaleDateString("fa-IR") : ""}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
