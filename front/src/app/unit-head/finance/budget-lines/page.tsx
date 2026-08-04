import Link from "next/link"
import { Calculator, Plus, Landmark, TrendingDown, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Card as GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Pagination } from "@/components/ui/pagination"
import { gets as getBudgetLines } from "@/app/actions/budgetLine/gets"

interface BudgetLineItem {
  _id: string
  code?: string
  title?: string
  description?: string
  totalAllocated?: number
  totalEncumbered?: number
  totalSpent?: number
  remainingBudget?: number
  fiscalYear?: { _id: string; name?: string }
}

function remainingColor(remaining?: number, allocated?: number) {
  if (!remaining || !allocated) return "text-fog"
  const ratio = remaining / allocated
  if (ratio <= 0.1) return "text-ember"
  if (ratio <= 0.3) return "text-amber-400"
  return "text-emerald-400"
}

export default async function UnitHeadFinanceBudgetLinesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getBudgetLines(
    { page, limit },
    {
      _id: 1,
      code: 1,
      title: 1,
      description: 1,
      totalAllocated: 1,
      totalEncumbered: 1,
      totalSpent: 1,
      remainingBudget: 1,
      fiscalYear: { _id: 1, name: 1 },
    },
  )

  const items: BudgetLineItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/unit-head/finance/budget-lines?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/unit-head/finance/budget-lines?page=${page + 1}` : ""

  let totalAllocated = 0
  let totalSpent = 0
  let totalRemaining = 0
  for (const it of items) {
    if (it.totalAllocated != null) totalAllocated += it.totalAllocated
    if (it.totalSpent != null) totalSpent += it.totalSpent
    if (it.remainingBudget != null) totalRemaining += it.remainingBudget
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="ردیف‌های بودجه" description="مدیریت ردیف‌های بودجه سازمان" />
        <Link href="/unit-head/finance/budget-lines/new">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="size-4" />
            ردیف جدید
          </Button>
        </Link>
      </div>

      {/* 1. KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        <StatCard
          label="تعداد ردیف‌ها"
          value={items.length}
          icon={Calculator}
          iconColor="text-electric-iris"
          iconBg="bg-electric-iris/10"
        />
        <StatCard
          label="مجموع تخصیص"
          value={`${totalAllocated.toLocaleString("fa-IR")} ریال`}
          icon={Landmark}
          iconColor="text-frost-link"
          iconBg="bg-frost-link/10"
        />
        <StatCard
          label="مجموع مصرف"
          value={`${totalSpent.toLocaleString("fa-IR")} ریال`}
          icon={TrendingDown}
          iconColor="text-amber-400"
          iconBg="bg-amber-400/10"
        />
        <StatCard
          label="باقی‌مانده کل"
          value={`${totalRemaining.toLocaleString("fa-IR")} ریال`}
          icon={Wallet}
          iconColor={totalRemaining > 0 ? "text-emerald-400" : "text-ember"}
          iconBg={totalRemaining > 0 ? "bg-emerald-400/10" : "bg-ember/10"}
        />
      </div>

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={Calculator} title="ردیف بودجه‌ای یافت نشد" description="هنوز هیچ ردیف بودجه‌ای ثبت نشده است." />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {items.map((item) => (
              <Link key={item._id} href={`/unit-head/finance/budget-lines/${item._id}`}>
                <GlassCard variant="glass" className="cursor-pointer transition-all duration-200 hover:border-frost-link/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-electric-iris/10 ring-1 ring-inset ring-electric-iris/15">
                          <Calculator className="size-5 text-electric-iris" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium text-frost-link">
                            {item.code ? `${item.code} - ${item.title || "—"}` : item.title || "—"}
                          </CardTitle>
                          {item.description && (
                            <p className="text-xs text-fog/50 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>
                      {item.fiscalYear?.name && (
                        <span className="text-xs text-fog/40">{item.fiscalYear.name}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-fog">تخصیص</p>
                        <p className="text-moonlight font-medium mt-0.5" dir="ltr">
                          {item.totalAllocated?.toLocaleString("fa-IR") || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-fog">مصرف شده</p>
                        <p className="text-moonlight font-medium mt-0.5" dir="ltr">
                          {item.totalSpent?.toLocaleString("fa-IR") || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-fog">باقی‌مانده</p>
                        <p className={`font-medium mt-0.5 ${remainingColor(item.remainingBudget, item.totalAllocated)}`} dir="ltr">
                          {item.remainingBudget?.toLocaleString("fa-IR") || "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </GlassCard>
              </Link>
            ))}
          </div>
          <Pagination prevUrl={prevPageUrl} nextUrl={nextPageUrl} page={page} />
        </>
      )}
    </div>
  )
}
