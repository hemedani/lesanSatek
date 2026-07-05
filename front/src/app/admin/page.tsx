import Link from "next/link"
import {
  Building2,
  Users,
  ShoppingCart,
  Workflow,
  GitBranch,
  Tags,
} from "lucide-react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      <PageHeader
        title="داشبورد"
        description="خلاصه وضعیت سامانه"
      />

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="group/card relative flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-[rgba(47,52,62,0.55)] py-(--card-spacing) text-sm text-card-foreground backdrop-blur-[16px] border border-white/8 shadow-[inset_0_0_48px_rgba(186,207,247,0.06),inset_0_1px_0_rgba(199,211,234,0.12),0_32px_64px_-32px_rgba(5,6,15,0.85)] transition-all duration-200 [--card-spacing:--spacing(4)] hover:border-white/15 hover:shadow-[inset_0_0_48px_rgba(186,207,247,0.10),inset_0_1px_0_rgba(199,211,234,0.18),0_32px_64px_-32px_rgba(5,6,15,0.9)]"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
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
            </div>
          )
        })}
      </div>

      {/* Quick Actions & System Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="group/card relative flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-[rgba(47,52,62,0.55)] py-(--card-spacing) text-sm text-card-foreground backdrop-blur-[16px] border border-white/8 shadow-[inset_0_0_48px_rgba(186,207,247,0.06),inset_0_1px_0_rgba(199,211,234,0.12),0_32px_64px_-32px_rgba(5,6,15,0.85)] transition-all duration-200 [--card-spacing:--spacing(4)] hover:border-white/15 hover:shadow-[inset_0_0_48px_rgba(186,207,247,0.10),inset_0_1px_0_rgba(199,211,234,0.18),0_32px_64px_-32px_rgba(5,6,15,0.9)]">
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
                      className="gap-2 rounded-full text-moonlight h-9 transition-all duration-200 hover:bg-white/[0.04] hover:text-glacier active:scale-[0.97]"
                    >
                      <Icon className="size-4" />
                      {action.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </div>

        <div className="group/card relative flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-[rgba(47,52,62,0.55)] py-(--card-spacing) text-sm text-card-foreground backdrop-blur-[16px] border border-white/8 shadow-[inset_0_0_48px_rgba(186,207,247,0.06),inset_0_1px_0_rgba(199,211,234,0.12),0_32px_64px_-32px_rgba(5,6,15,0.85)] transition-all duration-200 [--card-spacing:--spacing(4)] hover:border-white/15 hover:shadow-[inset_0_0_48px_rgba(186,207,247,0.10),inset_0_1px_0_rgba(199,211,234,0.18),0_32px_64px_-32px_rgba(5,6,15,0.9)]">
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
        </div>
      </div>
    </div>
  )
}
