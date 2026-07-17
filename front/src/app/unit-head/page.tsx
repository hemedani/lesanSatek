import Link from "next/link"
import { FileEdit, Clock, ShoppingCart, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { gets as getApprovals } from "@/app/actions/stepApproval/gets"
import { cookies } from "next/headers"
import { getUser } from "@/app/actions/user/getUser"

export default async function UnitHeadDashboard() {
  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let unitId: string | undefined

  if (activeRoleId) {
    const userRes = await getUser({}, {
      _id: 1,
      roles: { roleId: 1, scopeId: 1, scopeType: 1, name: 1 },
    }).catch(() => ({ success: false, body: null }))
    const user = userRes.success ? userRes.body : null
    const activeRole = user?.roles?.find((r: { roleId?: string }) => r.roleId === activeRoleId)
    if (activeRole?.scopeType === "unit" && activeRole.scopeId) {
      unitId = activeRole.scopeId
    }
  }

  const [draftsRes, pendingRes, allRes, approvalsRes] = await Promise.all([
    getPRs({ page: 1, limit: 1, unitId, status: "Draft" }, { _id: 1, status: 1 }).catch(() => ({ success: false, body: [] })),
    getApprovals({ page: 1, limit: 1, unitId, status: "pending" }, { _id: 1, status: 1 }).catch(() => ({ success: false, body: [] })),
    getPRs({ page: 1, limit: 50, unitId }, { _id: 1, status: 1 }).catch(() => ({ success: false, body: [] })),
    getApprovals({ page: 1, limit: 5, unitId, status: "pending" }, { _id: 1, status: 1, createdAt: 1 }).catch(() => ({ success: false, body: [] })),
  ])

  const allPRs: { status?: string }[] = allRes.success ? allRes.body || [] : []
  const pendingApprovals: { status?: string }[] = pendingRes.success ? pendingRes.body || [] : []
  const recentApprovals: { _id: string; status?: string; createdAt?: string }[] = approvalsRes.success ? approvalsRes.body || [] : []

  const draftCount = draftsRes.success ? (draftsRes.body || []).length : 0
  const pendingApprovalCount = pendingApprovals.length
  const totalPRs = allPRs.length
  const pendingPRs = allPRs.filter((p) => p.status === "Pending").length
  const approvedPRs = allPRs.filter((p) => p.status === "Approved").length
  const rejectedPRs = allPRs.filter((p) => p.status === "Rejected").length

  const navCards = [
    {
      title: "پیش‌نویس‌ها",
      description: "درخواست‌های ثبت نشده واحد",
      value: draftCount,
      icon: FileEdit,
      color: "text-fog",
      bg: "bg-white/[0.03]",
      href: "/unit-head/requests/drafts",
    },
    {
      title: "نیازمند تایید",
      description: "درخواست‌های ارجاع شده به واحد",
      value: pendingApprovalCount,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      href: "/unit-head/requests/pending",
    },
    {
      title: "همه درخواست‌ها",
      description: "لیست کامل درخواست‌های خرید",
      value: totalPRs,
      icon: ShoppingCart,
      color: "text-electric-iris",
      bg: "bg-electric-iris/10",
      href: "/unit-head/requests",
    },
  ]

  const stats = [
    { label: "در انتظار بررسی", value: pendingPRs, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "تایید شده", value: approvedPRs, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "رد شده", value: rejectedPRs, icon: XCircle, color: "text-ember", bg: "bg-ember/10" },
    { label: "فعال", value: totalPRs, icon: AlertCircle, color: "text-electric-iris", bg: "bg-electric-iris/10" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-glacier">داشبورد پنل واحد</h1>
        <p className="text-sm text-fog mt-1">خلاصه وضعیت درخواست‌های خرید واحد</p>
      </div>

      {/* Nav Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {navCards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href}>
              <Card variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-10 items-center justify-center rounded-lg ${card.bg} ring-1 ring-inset ring-white/[0.06]`}>
                      <Icon className={`size-5 ${card.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium text-frost-link leading-5">
                        {card.title}
                      </CardTitle>
                      <p className="text-xs text-fog/50 mt-0.5">{card.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-glacier leading-8">{card.value}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Status Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} variant="glass">
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
                <p className="text-2xl font-semibold text-glacier leading-8">{stat.value}</p>
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Pending Approvals */}
      <Card variant="glass">
        <CardHeader className="pb-3">
          <p className="text-sm font-medium text-fog tracking-wide">فعالیت اخیر</p>
          <CardTitle className="text-base font-medium text-frost-link mt-1">
            آخرین درخواست‌های نیازمند تایید
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentApprovals.length > 0 ? (
            <ul className="space-y-2">
              {recentApprovals.map((a) => (
                <li key={a._id} className="flex items-center gap-2 text-sm text-fog py-1">
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  {a.status === "pending" ? "در انتظار تایید" : a.status}
                  {a.createdAt && (
                    <span className="text-xs text-fog/50 ms-auto">
                      {new Date(a.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fog py-2">هیچ درخواست در انتظار تاییدی وجود ندارد</p>
          )}
          {pendingApprovalCount > 0 && (
            <div className="mt-4">
              <Link href="/unit-head/requests/pending">
                <Button variant="outline" size="sm">مشاهده همه</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
