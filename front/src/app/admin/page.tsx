import Link from "next/link"
import {
  Building2,
  Users,
  ShoppingCart,
  Workflow,
  GitBranch,
  Tags,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"

const stats = [
  { label: "سازمان‌ها", value: "—", icon: Building2 },
  { label: "کاربران", value: "—", icon: Users },
  { label: "درخواست‌های خرید", value: "—", icon: ShoppingCart },
  { label: "فرآیندهای فعال", value: "—", icon: Workflow },
]

const quickActions = [
  { label: "سازمان جدید", href: "/admin/organizations/add", icon: Building2 },
  { label: "کاربر جدید", href: "/admin/users/add", icon: Users },
  { label: "فرآیند جدید", href: "/admin/processes/add", icon: Workflow },
  { label: "واحد جدید", href: "/admin/units/add", icon: GitBranch },
  { label: "برچسب جدید", href: "/admin/tags/add", icon: Tags },
  { label: "درخواست خرید", href: "/admin/purchasing-requests/add", icon: ShoppingCart },
]

const systemMetrics = [
  { label: "کاربران فعال", value: "—" },
  { label: "سازمان‌ها", value: "—" },
  { label: "فرآیندها", value: "—" },
  { label: "درخواست‌ها", value: "—" },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative">
        <div className="blueprint-glow h-24 absolute inset-x-0 top-0 pointer-events-none" />
        <PageHeader
          title="داشبورد"
          description="خلاصه وضعیت سامانه"
        />
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-frost-link/[0.03] to-transparent pointer-events-none" />
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-electric-iris/10">
                    <Icon className="size-5 text-electric-iris" />
                  </div>
                  <CardTitle className="text-sm font-medium text-fog leading-5">
                    {stat.label}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-heading-sm font-semibold text-glacier leading-8">
                  {stat.value}
                </p>
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions & System Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <p className="text-caption font-medium text-fog tracking-wide leading-4">دسترسی سریع</p>
            <CardTitle className="text-base font-medium text-frost-link mt-1 leading-6">
              عملیات‌های پرکاربرد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.href} href={action.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 rounded-full text-moonlight h-9"
                    >
                      <Icon className="size-4" />
                      {action.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <p className="text-caption font-medium text-fog tracking-wide leading-4">وضعیت سامانه</p>
            <CardTitle className="text-base font-medium text-frost-link mt-1 leading-6">
              سلامت سرویس‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <StatusBadge status="active" label="همه سیستم‌ها فعال" />
              <StatusBadge status="completed" label="آخرین بروزرسانی: لحظاتی پیش" />
            </div>
            <div className="flex flex-wrap gap-6">
              {systemMetrics.map((metric) => (
                <div key={metric.label} className="flex flex-col gap-1">
                  <span className="text-heading-sm font-semibold text-glacier leading-7">
                    {metric.value}
                  </span>
                  <span className="text-caption text-fog leading-4">{metric.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
