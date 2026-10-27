import { EmptyState } from "@/components/ui/empty-state"
import { formatRial } from "@/components/accounting/money"
import type { IncomeStatement, IncomeStatementRow } from "@/components/accounting/types"
import { cn } from "@/lib/utils"

interface IncomeStatementReportProps {
  data: IncomeStatement | null
}

function StatementSection({
  title,
  rows,
  total,
}: {
  title: string
  rows: IncomeStatementRow[]
  total: number
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-steel-border/25">
      <div className="bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-moonlight">{title}</div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-fog/50">موردی ثبت نشده است.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.accountId} className="border-t border-steel-border/10">
                <td className="px-4 py-2.5">
                  <span dir="ltr" className="me-2 font-mono text-xs text-fog/60">{row.code}</span>
                  <span className="text-moonlight">{row.name}</span>
                </td>
                <td className="px-4 py-2.5 text-end font-mono tabular-nums text-fog/80" dir="ltr">
                  {formatRial(row.amount)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-steel-border/25 bg-white/[0.02] font-medium">
              <td className="px-4 py-2.5 text-fog">جمع {title}</td>
              <td className="px-4 py-2.5 text-end font-mono tabular-nums text-moonlight" dir="ltr">
                {formatRial(total)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}

function IncomeStatementReport({ data }: IncomeStatementReportProps) {
  if (!data || (data.revenue.length === 0 && data.expenses.length === 0)) {
    return (
      <EmptyState
        title="صورت سود و زیان خالی است"
        description="در بازه انتخابی حساب درآمد یا هزینه‌ای با گردش وجود ندارد."
      />
    )
  }

  const profitable = data.netIncome >= 0

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <StatementSection title="درآمدها" rows={data.revenue} total={data.totalRevenue} />
      <StatementSection title="هزینه‌ها" rows={data.expenses} total={data.totalExpenses} />

      <div
        className={cn(
          "rounded-2xl border p-5 lg:col-span-2",
          profitable
            ? "border-cipher-mint/25 bg-cipher-mint/5"
            : "border-ember/25 bg-ember/5",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-fog/70">سود / زیان خالص دوره</p>
            <p
              className={cn(
                "mt-1 font-mono text-2xl font-semibold tabular-nums",
                profitable ? "text-cipher-mint" : "text-ember",
              )}
              dir="ltr"
            >
              {formatRial(data.netIncome)}
            </p>
          </div>
          <div className="text-xs text-fog/60">
            <p>جمع درآمد: {formatRial(data.totalRevenue)}</p>
            <p className="mt-1">جمع هزینه: {formatRial(data.totalExpenses)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export { IncomeStatementReport }
