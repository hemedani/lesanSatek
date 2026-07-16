import Link from "next/link"
import { Building2, Users, ShoppingCart, Workflow, GitBranch, Tags, Gavel, Store } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"

import { gets as getOrganizations } from "@/app/actions/organization/gets"
import { getUsers } from "@/app/actions/user/getUsers"
import { gets as getPRs } from "@/app/actions/purchasingRequest/gets"
import { gets as getProcesses } from "@/app/actions/process/gets"
import { gets as getTenders } from "@/app/actions/tender/gets"
import { gets as getStores } from "@/app/actions/store/gets"

export default async function AdminDashboard() {
  const [orgsRes, usersRes, prsRes, procsRes, tendersRes, storesRes] = await Promise.all([
    getOrganizations({ page: 1, limit: 1 }, { _id: 1 }).catch(() => ({ success: false, body: [] })),
    getUsers({ page: 1, limit: 1 }, { _id: 1 }).catch(() => ({ success: false, body: [] })),
    getPRs({ page: 1, limit: 1 }, { _id: 1 }).catch(() => ({ success: false, body: [] })),
    getProcesses({ page: 1, limit: 1 }, { _id: 1 }).catch(() => ({ success: false, body: [] })),
    getTenders({ page: 1, limit: 1 }, { _id: 1 }).catch(() => ({ success: false, body: [] })),
    getStores({ page: 1, limit: 1 }, { _id: 1 }).catch(() => ({ success: false, body: [] })),
  ]);

  const stats = [
    { label: "سازمان‌ها", value: orgsRes.success ? (orgsRes.body?.length || "—") : "—", icon: Building2 },
    { label: "کاربران", value: usersRes.success ? (usersRes.body?.length || "—") : "—", icon: Users },
    { label: "درخواست‌های خرید", value: prsRes.success ? (prsRes.body?.length || "—") : "—", icon: ShoppingCart },
    { label: "فرآیندهای فعال", value: procsRes.success ? (procsRes.body?.length || "—") : "—", icon: Workflow },
    { label: "مناقصات", value: tendersRes.success ? (tendersRes.body?.length || "—") : "—", icon: Gavel },
    { label: "فروشگاه‌ها", value: storesRes.success ? (storesRes.body?.length || "—") : "—", icon: Store },
  ];

  const quickActions = [
    { label: "سازمان جدید", href: "/admin/organizations/add", icon: Building2 },
    { label: "کاربر جدید", href: "/admin/users/add", icon: Users },
    { label: "فرآیند جدید", href: "/admin/processes/add", icon: Workflow },
    { label: "واحد جدید", href: "/admin/units/add", icon: GitBranch },
    { label: "درخواست خرید", href: "/admin/purchasing-requests/new", icon: ShoppingCart },
    { label: "برچسب جدید", href: "/admin/tags", icon: Tags },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="داشبورد" description="خلاصه وضعیت سامانه" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} variant="glass">
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
                <p className="text-2xl font-semibold text-glacier leading-8">
                  {stat.value}
                </p>
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
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.href} href={action.href}>
                    <Button variant="ghost" size="sm" className="gap-2 rounded-full text-moonlight h-9 transition-all duration-200 hover:bg-white/[0.04] hover:text-glacier">
                      <Icon className="size-4" />
                      {action.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-fog tracking-wide">وضعیت سامانه</p>
            <CardTitle className="text-base font-medium text-frost-link mt-1">
              سلامت سرویس‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <StatusBadge status="active" label="همه سیستم‌ها فعال" />
              <StatusBadge status="completed" label="سرویس پشتیبان آنلاین" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
