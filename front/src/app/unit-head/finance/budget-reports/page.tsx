import { Calculator, Wallet, TrendingDown, FileSpreadsheet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
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
}

function remainingColor(remaining?: number, allocated?: number) {
  if (!remaining || !allocated) return "text-fog"
  const ratio = remaining / allocated
  if (ratio <= 0.1) return "text-ember"
  if (ratio <= 0.3) return "text-amber-400"
  return "text-emerald-400"
}

export default async function UnitHeadFinanceBudgetReportsPage() {
  const result = await getBudgetLines(
    { page: 1, limit: 100 },
    {
      _id: 1, code: 1, title: 1, description: 1,
      totalAllocated: 1, totalEncumbered: 1, totalSpent: 1, remainingBudget: 1,
    },
  )

  const items: BudgetLineItem[] = result.success ? result.body || [] : []
  const totalAllocated = items.reduce((s, i) => s + (i.totalAllocated || 0), 0)
  const totalSpent = items.reduce((s, i) => s + (i.totalSpent || 0), 0)
  const totalRemaining = items.reduce((s, i) => s + (i.remainingBudget || 0), 0)
  const consumptionRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0

  const summaryCards = [
    {
      label: "بودجه کل",
      value: `${totalAllocated.toLocaleString("fa-IR")} ریال`,
      icon: Wallet,
      color: "text-electric-iris",
    },
    {
      label: "مصرف شده",
      value: `${totalSpent.toLocaleString("fa-IR")} ریال`,
      icon: TrendingDown,
      color: "text-amber-400",
    },
    {
      label: "باقی‌مانده",
      value: `${totalRemaining.toLocaleString("fa-IR")} ریال`,
      icon: Calculator,
      color: totalRemaining > 0 ? "text-emerald-400" : "text-ember",
    },
    {
      label: "نرخ مصرف",
      value: `${consumptionRate.toFixed(1)}%`,
      icon: FileSpreadsheet,
      color: "text-frost-link",
    },
  ]

  return (
    <div className="space-y-8">
      <PageHeader title="گزارش بودجه" description="خلاصه وضعیت بودجه سازمان" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} variant="glass">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-white/[0.03] ring-1 ring-inset ring-white/[0.06]">
                    <Icon className={`size-5 ${card.color}`} />
                  </div>
                  <CardTitle className="text-sm font-medium text-fog leading-5">{card.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-glacier leading-8">{card.value}</p>
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-frost-link/15 to-transparent" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card variant="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-frost-link">تفکیک ردیف‌های بودجه</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-fog/50">هیچ ردیف بودجه‌ای ثبت نشده است.</p>
          ) : (
            <div className="divide-y divide-steel-border/10">
              {items.map((item) => (
                <div key={item._id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-moonlight">
                      {item.code ? `${item.code} - ${item.title || "—"}` : item.title || "—"}
                    </span>
                    <span className={`text-sm font-medium ${remainingColor(item.remainingBudget, item.totalAllocated)}`} dir="ltr">
                      {item.remainingBudget?.toLocaleString("fa-IR") || "—"} ریال
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs text-fog/50">
                    <span>تخصیص: {item.totalAllocated?.toLocaleString("fa-IR") || "—"}</span>
                    <span>مصرف: {item.totalSpent?.toLocaleString("fa-IR") || "—"}</span>
                    <span>
                      نرخ مصرف: {item.totalAllocated && item.totalAllocated > 0
                        ? `${((item.totalSpent || 0) / item.totalAllocated * 100).toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
