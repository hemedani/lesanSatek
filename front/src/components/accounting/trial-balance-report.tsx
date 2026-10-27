import { AlertCircle, CheckCircle2 } from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import { ACCOUNT_TYPE_LABELS, labelOf } from "@/components/accounting/labels"
import { formatRial } from "@/components/accounting/money"
import type { TrialBalance, TrialBalanceRow } from "@/components/accounting/types"
import { cn } from "@/lib/utils"

interface TrialBalanceReportProps {
  data: TrialBalance | null
}

function TrialBalanceReport({ data }: TrialBalanceReportProps) {
  if (!data || data.accounts.length === 0) {
    return (
      <EmptyState
        title="تراز آزمایشی خالی است"
        description="در بازه انتخابی سند ثبت‌شده‌ای وجود ندارد."
      />
    )
  }

  const grouped = data.accounts.reduce<Record<string, typeof data.accounts>>((acc, row) => {
    const type = row.accountType || "other"
    acc[type] = acc[type] ? [...acc[type], row] : [row]
    return acc
  }, {})

  const balanced = Math.abs(data.totals.difference) <= 0.01

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm",
          balanced
            ? "border-cipher-mint/25 bg-cipher-mint/10 text-cipher-mint"
            : "border-ember/25 bg-ember/10 text-ember",
        )}
      >
        {balanced ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
        {balanced
          ? "تراز آزمایشی متوازن است."
          : `اختلاف تراز: ${formatRial(data.totals.difference)}`}
      </div>

      <div className="overflow-x-auto rounded-xl border border-steel-border/25">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-[#282c35] text-xs text-fog/80">
              <th className="px-3 py-2.5 text-start font-medium">کد</th>
              <th className="px-3 py-2.5 text-start font-medium">نام حساب</th>
              <th className="px-3 py-2.5 text-start font-medium">ماهیت</th>
              <th className="px-3 py-2.5 text-end font-medium">بدهکار</th>
              <th className="px-3 py-2.5 text-end font-medium">بستانکار</th>
              <th className="px-3 py-2.5 text-end font-medium">مانده</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([type, rows]) => {
              const subtotal = rows.reduce(
                (acc, row) => {
                  acc.debit += row.debit
                  acc.credit += row.credit
                  return acc
                },
                { debit: 0, credit: 0 },
              )
              return (
                <FragmentRows key={type} type={type} rows={rows} subtotal={subtotal} />
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-steel-border/30 bg-white/[0.03] font-medium">
              <td colSpan={3} className="px-3 py-3 text-moonlight">جمع کل</td>
              <td className="px-3 py-3 text-end font-mono tabular-nums text-moonlight" dir="ltr">
                {formatRial(data.totals.debit)}
              </td>
              <td className="px-3 py-3 text-end font-mono tabular-nums text-moonlight" dir="ltr">
                {formatRial(data.totals.credit)}
              </td>
              <td className="px-3 py-3 text-end font-mono tabular-nums" dir="ltr">
                {formatRial(data.totals.difference)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function FragmentRows({
  type,
  rows,
  subtotal,
}: {
  type: string
  rows: TrialBalanceRow[]
  subtotal: { debit: number; credit: number }
}) {
  return (
    <>
      <tr className="border-t border-steel-border/20 bg-white/[0.025]">
        <td colSpan={6} className="px-3 py-2 text-xs font-medium text-frost-link">
          {ACCOUNT_TYPE_LABELS[type] || "سایر"}
        </td>
      </tr>
      {rows.map((row) => (
        <tr key={row.accountId} className="border-t border-steel-border/10">
          <td className="px-3 py-2 font-mono text-xs text-fog" dir="ltr">{row.code}</td>
          <td className="px-3 py-2 text-moonlight">{row.name}</td>
          <td className="px-3 py-2 text-fog/70">{labelOf({ debit: "بدهکار", credit: "بستانکار" }, row.normalBalance)}</td>
          <td className="px-3 py-2 text-end font-mono tabular-nums text-fog/80" dir="ltr">
            {formatRial(row.debit)}
          </td>
          <td className="px-3 py-2 text-end font-mono tabular-nums text-fog/80" dir="ltr">
            {formatRial(row.credit)}
          </td>
          <td className="px-3 py-2 text-end font-mono tabular-nums text-moonlight" dir="ltr">
            {formatRial(row.balance)}
          </td>
        </tr>
      ))}
      <tr className="border-t border-steel-border/15 bg-white/[0.015] text-xs">
        <td colSpan={3} className="px-3 py-2 text-fog/60">جمع {ACCOUNT_TYPE_LABELS[type] || type}</td>
        <td className="px-3 py-2 text-end font-mono tabular-nums text-fog/80" dir="ltr">
          {formatRial(subtotal.debit)}
        </td>
        <td className="px-3 py-2 text-end font-mono tabular-nums text-fog/80" dir="ltr">
          {formatRial(subtotal.credit)}
        </td>
        <td className="px-3 py-2 text-end font-mono tabular-nums text-fog/60" dir="ltr">
          {formatRial(subtotal.debit - subtotal.credit)}
        </td>
      </tr>
    </>
  )
}

export { TrialBalanceReport }
