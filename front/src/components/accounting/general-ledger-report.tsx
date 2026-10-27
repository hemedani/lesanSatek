import Link from "next/link"

import { EmptyState } from "@/components/ui/empty-state"
import { formatJalaliDate, formatRial } from "@/components/accounting/money"
import type { GeneralLedger } from "@/components/accounting/types"

interface GeneralLedgerReportProps {
  data: GeneralLedger | null
  basePath: string
}

function GeneralLedgerReport({ data, basePath }: GeneralLedgerReportProps) {
  if (!data) {
    return (
      <EmptyState
        title="حسابی انتخاب نشده است"
        description="برای مشاهده دفتر کل، یک حساب انتخاب کنید."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="glass-card grid gap-3 rounded-2xl p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-fog/60">حساب</p>
          <p className="mt-1 text-sm text-moonlight">
            <span dir="ltr" className="me-2 font-mono text-xs text-fog/60">{data.account.code}</span>
            {data.account.name}
          </p>
        </div>
        <div>
          <p className="text-xs text-fog/60">مانده ابتدای دوره</p>
          <p className="mt-1 font-mono text-sm text-moonlight" dir="ltr">{formatRial(data.openingBalance)}</p>
        </div>
        <div>
          <p className="text-xs text-fog/60">مانده پایان دوره</p>
          <p className="mt-1 font-mono text-sm font-semibold text-glacier" dir="ltr">{formatRial(data.closingBalance)}</p>
        </div>
      </div>

      {data.lines.length === 0 ? (
        <EmptyState title="گردشی برای این حساب ثبت نشده است" description="بازه یا حساب دیگری را انتخاب کنید." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-steel-border/25">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="bg-[#282c35] text-xs text-fog/80">
                <th className="px-3 py-2.5 text-start font-medium">#</th>
                <th className="px-3 py-2.5 text-start font-medium">شماره سند</th>
                <th className="px-3 py-2.5 text-start font-medium">تاریخ</th>
                <th className="px-3 py-2.5 text-start font-medium">شرح</th>
                <th className="px-3 py-2.5 text-start font-medium">مرکز هزینه</th>
                <th className="px-3 py-2.5 text-start font-medium">فروشگاه</th>
                <th className="px-3 py-2.5 text-end font-medium">بدهکار</th>
                <th className="px-3 py-2.5 text-end font-medium">بستانکار</th>
                <th className="px-3 py-2.5 text-end font-medium">مانده جاری</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
                <tr key={line._id} className="border-t border-steel-border/10 hover:bg-white/[0.02]">
                  <td className="px-3 py-2 text-fog/60">{line.lineNumber}</td>
                  <td className="px-3 py-2">
                    {line.entryId && line.entryNumber ? (
                      <Link
                        href={`${basePath}/journal-entries/${line.entryId}`}
                        dir="ltr"
                        className="font-mono text-xs text-frost-link hover:text-electric-iris"
                      >
                        {line.entryNumber}
                      </Link>
                    ) : (
                      <span className="text-fog/50">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-fog/70">{formatJalaliDate(line.entryDate)}</td>
                  <td className="max-w-64 truncate px-3 py-2 text-fog/80">{line.description || "—"}</td>
                  <td className="px-3 py-2 text-fog/70">{line.costCenterName || "—"}</td>
                  <td className="px-3 py-2 text-fog/70">{line.storeName || "—"}</td>
                  <td className="px-3 py-2 text-end font-mono tabular-nums text-fog/80" dir="ltr">
                    {line.debit ? formatRial(line.debit) : "—"}
                  </td>
                  <td className="px-3 py-2 text-end font-mono tabular-nums text-fog/80" dir="ltr">
                    {line.credit ? formatRial(line.credit) : "—"}
                  </td>
                  <td className="px-3 py-2 text-end font-mono tabular-nums text-moonlight" dir="ltr">
                    {formatRial(line.runningBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-steel-border/30 bg-white/[0.03] font-medium">
                <td colSpan={6} className="px-3 py-3 text-moonlight">جمع</td>
                <td className="px-3 py-3 text-end font-mono tabular-nums text-moonlight" dir="ltr">
                  {formatRial(data.totals.debit)}
                </td>
                <td className="px-3 py-3 text-end font-mono tabular-nums text-moonlight" dir="ltr">
                  {formatRial(data.totals.credit)}
                </td>
                <td className="px-3 py-3 text-end font-mono tabular-nums text-glacier" dir="ltr">
                  {formatRial(data.closingBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export { GeneralLedgerReport }
