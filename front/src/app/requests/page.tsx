import Link from "next/link"
import { ShoppingCart, CheckCircle, XCircle, Clock, Package, Plus, Warehouse, ScrollText, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { getMe } from "@/app/actions/user/getMe"
import { cookies } from "next/headers"

const statusMap: Record<string, string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار تایید",
  approved: "تایید شده",
  rejected: "رد شده",
  in_progress: "در حال انجام",
  completed: "تکمیل شده",
}

export default async function RequestsDashboard() {
  const cookieStore = await cookies()
  const activeRoleId = cookieStore.get("activeRoleId")?.value
  let currentUserId: string | undefined

  if (activeRoleId) {
    const userRes = await getMe({
      _id: 1,
      roles: 1,
    }).catch(() => ({ success: false, body: null }))
    const user = userRes.success ? userRes.body : null
    currentUserId = user?._id
  }

  const [prsRes, receiptRes] = await Promise.all([
    getPRs(
      { page: 1, limit: 5 },
      { _id: 1, title: 1, status: 1, createdAt: 1 },
    ),
    currentUserId
      ? getPRs(
          { page: 1, limit: 1, requesterId: currentUserId, stuffStatus: "delivered" },
          { _id: 1, title: 1 },
        )
      : Promise.resolve({ success: false, body: [] }),
  ])

  const prs = prsRes.success ? prsRes.body || [] : []
  const receiptCount = receiptRes.success ? (receiptRes.body || []).length : 0

  const total = prs.length
  const pending = prs.filter((p: { status?: string }) => p.status === "pending" || p.status === "draft").length
  const approved = prs.filter((p: { status?: string }) => p.status === "approved").length
  const rejected = prs.filter((p: { status?: string }) => p.status === "rejected").length

  const stats = [
    { label: "کل درخواست‌ها", value: total, icon: ShoppingCart, color: "text-electric-iris", bg: "bg-electric-iris/10", href: "/requests/my-requests" },
    { label: "در انتظار", value: pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", href: "/requests/my-requests" },
    { label: "تایید شده", value: approved, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/requests/my-requests" },
    { label: "آماده تحویل", value: receiptCount, icon: Package, color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/requests/my-requests?tab=receipt" },
    { label: "رد شده", value: rejected, icon: XCircle, color: "text-ember", bg: "bg-ember/10", href: "/requests/my-requests" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-glacier">درخواست‌های خرید</h1>
          <p className="text-sm text-fog mt-1">ثبت و پیگیری درخواست‌های خرید</p>
        </div>
        <Link href="/requests/new">
          <Button className="gap-2">
            <Plus className="size-4" />
            درخواست جدید
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
                  <p className="text-2xl font-semibold text-glacier leading-8">{stat.value}</p>
                  <div className="mt-4 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/requests/inventory">
          <Card variant="glass" className="group cursor-pointer transition-all duration-200 hover:border-frost-link/30 hover:shadow-lg hover:shadow-frost-link/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-400/10 ring-1 ring-inset ring-white/[0.06]">
                  <Warehouse className="size-5 text-emerald-400" />
                </div>
                <CardTitle className="text-sm font-medium text-fog leading-5">
                  انبار واحد
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-fog/60 leading-5">مشاهده موجودی انبار واحد خود و رهگیری موجودی کالاها</p>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/requests/consumption">
          <Card variant="glass" className="group cursor-pointer transition-all duration-200 hover:border-frost-link/30 hover:shadow-lg hover:shadow-frost-link/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-inset ring-white/[0.06]">
                  <ScrollText className="size-5 text-amber-400" />
                </div>
                <CardTitle className="text-sm font-medium text-fog leading-5">
                  مصرف کالا
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-fog/60 leading-5">ثبت مصرف کالاهای انبار و مشاهده سوابق مصرف</p>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/requests/stock-movements">
          <Card variant="glass" className="group cursor-pointer transition-all duration-200 hover:border-frost-link/30 hover:shadow-lg hover:shadow-frost-link/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-white/[0.06]">
                  <Activity className="size-5 text-electric-iris" />
                </div>
                <CardTitle className="text-sm font-medium text-fog leading-5">
                  گردش کالا
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-fog/60 leading-5">گردش و جابجایی کالاها بین واحدها و انبارها</p>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-frost-link/20 to-transparent" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="glass">
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-fog tracking-wide">دسترسی سریع</p>
            <CardTitle className="text-base font-medium text-frost-link mt-1">
              عملیات‌های پرکاربرد
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/requests/new">
              <Button variant="outline" size="sm">ثبت درخواست خرید جدید</Button>
            </Link>
            <Link href="/requests/my-requests">
              <Button variant="outline" size="sm">درخواست‌های من</Button>
            </Link>
            <Link href="/requests/my-requests?tab=receipt">
              <Button variant="outline" size="sm">دریافت کالا</Button>
            </Link>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-fog tracking-wide">آخرین درخواست‌ها</p>
            <CardTitle className="text-base font-medium text-frost-link mt-1">
              ۵ درخواست اخیر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prs.length > 0 ? (
              <ul className="space-y-2">
                {prs.map((p: { _id: string; title?: string; status?: string }) => (
                  <li key={p._id} className="flex items-center justify-between py-1">
                    <Link href={`/requests/${p._id}`} className="text-sm text-frost-link hover:underline">
                      {p.title || "بدون عنوان"}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status || "draft"} labelMap={statusMap} size="sm" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fog py-2">هیچ درخواستی ثبت نشده است</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
