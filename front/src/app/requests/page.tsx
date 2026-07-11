import Link from "next/link"
import { ShoppingCart, CheckCircle, XCircle, Clock, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"

const statusMap: Record<string, string> = {
  draft: "پیش‌نویس",
  pending: "در انتظار تایید",
  approved: "تایید شده",
  rejected: "رد شده",
  in_progress: "در حال انجام",
  completed: "تکمیل شده",
}

export default async function RequestsDashboard() {
  const prsRes = await getPRs(
    { page: 1, limit: 5 },
    {
      _id: 1,
      title: 1,
      status: 1,
      estimatedAmount: 1,
      createdAt: 1,
    },
  )
  const prs = prsRes.success ? prsRes.body || [] : []
  const total = prs.length
  const pending = prs.filter((p: { status?: string }) => p.status === "pending" || p.status === "draft").length
  const approved = prs.filter((p: { status?: string }) => p.status === "approved").length
  const rejected = prs.filter((p: { status?: string }) => p.status === "rejected").length

  const stats = [
    { label: "کل درخواست‌ها", value: total, icon: ShoppingCart, color: "text-electric-iris", bg: "bg-electric-iris/10" },
    { label: "در انتظار", value: pending, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "تایید شده", value: approved, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "رد شده", value: rejected, icon: XCircle, color: "text-ember", bg: "bg-ember/10" },
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg} ring-1 ring-inset ring-${stat.color.replace("text-", "")}/15`}>
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
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/requests/new">
              <Button variant="outline" size="sm">ثبت درخواست خرید جدید</Button>
            </Link>
            <Link href="/requests/my-requests">
              <Button variant="outline" size="sm">درخواست‌های من</Button>
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
                {prs.map((p: { _id: string; title?: string; status?: string; estimatedAmount?: number }) => (
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
