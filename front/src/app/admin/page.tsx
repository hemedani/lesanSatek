import {
  Building2,
  Users,
  ShoppingCart,
  Workflow,
  Gavel,
  Store,
  GitBranch,
  Wallet,
  Boxes,
  ScrollText,
  Activity,
  Package,
  Box,
  CalendarRange,
  BarChart3,
  ClipboardCheck,
  Banknote,
} from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { NavCard } from "@/components/dashboard/nav-card"

import { count as countOrganizations } from "@/app/actions/organization/count"
import { countUsers } from "@/app/actions/user/countUsers"
import { count as countPurchasingRequests } from "@/app/actions/purchasingRequest/count"
import { count as countProcesses } from "@/app/actions/process/count"
import { count as countTenders } from "@/app/actions/tender/count"
import { count as countStores } from "@/app/actions/store/count"
import { count as countUnits } from "@/app/actions/unit/count"
import { count as countBudgetLines } from "@/app/actions/budgetLine/count"

function countOf(res: { success: boolean; body?: { qty?: number } }): number | null {
  return res.success && typeof res.body?.qty === "number" ? res.body.qty : null
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-body-sm font-medium tracking-wide text-fog/80">
      {children}
    </h2>
  )
}

export default async function AdminDashboard() {
  const [
    orgsRes,
    usersRes,
    prsRes,
    procsRes,
    tendersRes,
    storesRes,
    unitsRes,
    budgetLinesRes,
  ] = await Promise.all([
    countOrganizations({ activeRoleId: "" }).catch(() => ({ success: false as const, body: undefined })),
    countUsers({ activeRoleId: "" }).catch(() => ({ success: false as const, body: undefined })),
    countPurchasingRequests({ activeRoleId: "" }).catch(() => ({ success: false as const, body: undefined })),
    countProcesses({ activeRoleId: "" }).catch(() => ({ success: false as const, body: undefined })),
    countTenders({ activeRoleId: "" }).catch(() => ({ success: false as const, body: undefined })),
    countStores({ activeRoleId: "" }).catch(() => ({ success: false as const, body: undefined })),
    countUnits({ activeRoleId: "" }).catch(() => ({ success: false as const, body: undefined })),
    countBudgetLines({ activeRoleId: "" }).catch(() => ({ success: false as const, body: undefined })),
  ])

  const orgs = countOf(orgsRes)
  const users = countOf(usersRes)
  const prs = countOf(prsRes)
  const processes = countOf(procsRes)
  const tenders = countOf(tendersRes)
  const stores = countOf(storesRes)
  const units = countOf(unitsRes)
  const budgetLines = countOf(budgetLinesRes)

  return (
    <div className="space-y-8">
      <PageHeader
        title="داشبورد مدیریت"
        description="نمای کلی سامانه — آمار کلیدی و دسترسی سریع به بخش‌های مدیریتی"
      />

      {/* ── KPI row ───────────────────────────────────────────────── */}
      <section className="space-y-4" aria-label="آمار کلیدی">
        <SectionLabel>آمار کلیدی</SectionLabel>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6 lg:gap-5">
          <StatCard label="سازمان‌ها" value={orgs ?? "—"} icon={Building2} iconColor="text-electric-iris" iconBg="bg-electric-iris/10" />
          <StatCard label="کاربران" value={users ?? "—"} icon={Users} iconColor="text-glacier" iconBg="bg-frost-link/10" />
          <StatCard label="درخواست‌های خرید" value={prs ?? "—"} icon={ShoppingCart} iconColor="text-amber-400" iconBg="bg-amber-400/10" />
          <StatCard label="فرآیندها" value={processes ?? "—"} icon={Workflow} iconColor="text-violet-400" iconBg="bg-violet-400/10" />
          <StatCard label="مناقصات" value={tenders ?? "—"} icon={Gavel} iconColor="text-sky-400" iconBg="bg-sky-400/10" />
          <StatCard label="فروشگاه‌ها" value={stores ?? "—"} icon={Store} iconColor="text-emerald-400" iconBg="bg-emerald-400/10" />
        </div>
      </section>

      {/* ── Main management nav ───────────────────────────────────── */}
      <section className="space-y-4" aria-label="مدیریت اصلی">
        <SectionLabel>مدیریت اصلی</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          <NavCard
            href="/admin/organizations"
            title="سازمان‌ها"
            description="مدیریت سازمان‌ها و ساختار آن‌ها"
            value={orgs ?? undefined}
            icon={Building2}
            iconColor="text-electric-iris"
            iconBg="bg-electric-iris/10"
            footerLabel="مدیریت سازمان‌ها"
          />
          <NavCard
            href="/admin/units"
            title="واحدها"
            description="ساختار واحدها و زیرواحدها"
            value={units ?? undefined}
            icon={GitBranch}
            iconColor="text-violet-400"
            iconBg="bg-violet-400/10"
            footerLabel="مدیریت واحدها"
          />
          <NavCard
            href="/admin/users"
            title="کاربران"
            description="کاربران و نقش‌های دسترسی"
            value={users ?? undefined}
            icon={Users}
            iconColor="text-glacier"
            iconBg="bg-frost-link/10"
            footerLabel="مدیریت کاربران"
          />
          <NavCard
            href="/admin/processes"
            title="فرآیندها"
            description="تعریف و مدیریت فرآیندهای کاری"
            value={processes ?? undefined}
            icon={Workflow}
            iconColor="text-violet-400"
            iconBg="bg-violet-400/10"
            footerLabel="مدیریت فرآیندها"
          />
          <NavCard
            href="/admin/purchasing-requests"
            title="درخواست‌های خرید"
            description="همه درخواست‌های خرید ثبت‌شده"
            value={prs ?? undefined}
            icon={ShoppingCart}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            footerLabel="مشاهده درخواست‌ها"
          />
          <NavCard
            href="/admin/tenders"
            title="مناقصات"
            description="مناقصه‌ها و پیشنهادهای ثبت‌شده"
            value={tenders ?? undefined}
            icon={Gavel}
            iconColor="text-sky-400"
            iconBg="bg-sky-400/10"
            footerLabel="مدیریت مناقصات"
          />
          <NavCard
            href="/admin/stores"
            title="فروشگاه‌ها"
            description="فروشگاه‌های سازمان"
            value={stores ?? undefined}
            icon={Store}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
            footerLabel="مدیریت فروشگاه‌ها"
          />
          <NavCard
            href="/admin/budget-lines"
            title="خطوط بودجه"
            description="خطوط بودجه و تخصیص‌ها"
            value={budgetLines ?? undefined}
            icon={Wallet}
            iconColor="text-rose-400"
            iconBg="bg-rose-400/10"
            footerLabel="مدیریت بودجه"
          />
        </div>
      </section>

      {/* ── Warehouse & inventory nav ─────────────────────────────── */}
      <section className="space-y-4" aria-label="موجودی و انبار">
        <SectionLabel>موجودی و انبار</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          <NavCard
            href="/admin/inventory"
            title="موجودی انبار"
            description="موجودی کالاهای واحدها"
            icon={Boxes}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
            footerLabel="مدیریت موجودی"
          />
          <NavCard
            href="/admin/consumption"
            title="مصرف کالا"
            description="رکوردهای مصرف کالاها"
            icon={ScrollText}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            footerLabel="مدیریت مصرف"
          />
          <NavCard
            href="/admin/stock-movements"
            title="گردش کالا"
            description="تاریخچه جابه‌جایی کالاها"
            icon={Activity}
            iconColor="text-sky-400"
            iconBg="bg-sky-400/10"
            footerLabel="مدیریت گردش کالا"
          />
          <NavCard
            href="/admin/wares"
            title="کالاها"
            description="کالاهای تعریف‌شده در سامانه"
            icon={Package}
            iconColor="text-electric-iris"
            iconBg="bg-electric-iris/10"
            footerLabel="مدیریت کالاها"
          />
          <NavCard
            href="/admin/stuff"
            title="اجناس"
            description="موجودی اجناس فروشگاه‌ها"
            icon={Box}
            iconColor="text-rose-400"
            iconBg="bg-rose-400/10"
            footerLabel="مدیریت اجناس"
          />
          <NavCard
            href="/admin/goods-receipts"
            title="رسید کالا"
            description="رسیدهای دریافت کالا"
            icon={ClipboardCheck}
            iconColor="text-sky-400"
            iconBg="bg-sky-400/10"
            footerLabel="مدیریت رسیدها"
          />
        </div>
      </section>

      {/* ── Finance & reports nav ─────────────────────────────────── */}
      <section className="space-y-4" aria-label="مالی و گزارش">
        <SectionLabel>مالی و گزارش</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          <NavCard
            href="/admin/fiscal-years"
            title="سال‌های مالی"
            description="سال‌های مالی تعریف‌شده"
            icon={CalendarRange}
            iconColor="text-violet-400"
            iconBg="bg-violet-400/10"
            footerLabel="مدیریت سال‌های مالی"
          />
          <NavCard
            href="/admin/budget-reports"
            title="گزارش بودجه"
            description="گزارش‌های خطوط بودجه"
            icon={BarChart3}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-400/10"
            footerLabel="مشاهده گزارش‌ها"
          />
          <NavCard
            href="/admin/payment-orders"
            title="دستورهای پرداخت"
            description="پرداخت‌های ثبت‌شده"
            icon={Banknote}
            iconColor="text-amber-400"
            iconBg="bg-amber-400/10"
            footerLabel="مدیریت پرداخت‌ها"
          />
        </div>
      </section>
    </div>
  )
}
