import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SourceLink } from "@/components/accounting/source-link"
import {
  ENTRY_STATUS_LABELS,
  labelOf,
} from "@/components/accounting/labels"
import { formatJalaliDate, formatJalaliDateTime, formatRial } from "@/components/accounting/money"
import type { JournalEntry, JournalLine } from "@/components/accounting/types"

interface JournalEntryDetailProps {
  entry: JournalEntry
  mode: "admin" | "unit-head"
}

function snapshotLines(snapshot: unknown): JournalLine[] {
  if (Array.isArray(snapshot)) return snapshot as JournalLine[]
  if (snapshot && typeof snapshot === "object" && "lines" in snapshot) {
    const lines = (snapshot as { lines?: unknown }).lines
    if (Array.isArray(lines)) return lines as JournalLine[]
  }
  return []
}

function LinesTable({ lines }: { lines: JournalLine[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-steel-border/25">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#282c35]">
            <TableHead className="text-caption text-fog/80">#</TableHead>
            <TableHead className="text-caption text-fog/80">حساب</TableHead>
            <TableHead className="text-caption text-fog/80">شرح</TableHead>
            <TableHead className="text-caption text-fog/80">مرکز هزینه</TableHead>
            <TableHead className="text-caption text-fog/80">واحد</TableHead>
            <TableHead className="text-caption text-fog/80">فروشگاه</TableHead>
            <TableHead className="text-caption text-fog/80">بدهکار</TableHead>
            <TableHead className="text-caption text-fog/80">بستانکار</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line, index) => (
            <TableRow key={line._id || index}>
              <TableCell className="text-fog/70">{line.lineNumber ?? index + 1}</TableCell>
              <TableCell className="min-w-52">
                <span className="block text-moonlight">{line.account?.name || "—"}</span>
                <span dir="ltr" className="block font-mono text-xs text-fog/50">
                  {line.account?.code || "—"}
                </span>
              </TableCell>
              <TableCell className="text-fog/80">{line.description || "—"}</TableCell>
              <TableCell className="text-fog/80">{line.costCenter?.name || "—"}</TableCell>
              <TableCell className="text-fog/80">{line.unit?.name || "—"}</TableCell>
              <TableCell className="text-fog/80">{line.store?.name || "—"}</TableCell>
              <TableCell className="text-end font-mono tabular-nums text-moonlight" dir="ltr">
                {line.debit ? formatRial(line.debit) : "—"}
              </TableCell>
              <TableCell className="text-end font-mono tabular-nums text-moonlight" dir="ltr">
                {line.credit ? formatRial(line.credit) : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function JournalEntryDetail({ entry, mode }: JournalEntryDetailProps) {
  const lines = entry.lines || []
  const snapshot = snapshotLines(entry.lineSnapshot)
  const changed =
    snapshot.length > 0 &&
    (snapshot.length !== lines.length ||
      snapshot.some(
        (line, index) =>
          line.debit !== lines[index]?.debit ||
          line.credit !== lines[index]?.credit ||
          line.account?._id !== lines[index]?.account?._id,
      ))

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span dir="ltr" className="font-mono text-lg font-semibold text-glacier">
                {entry.entryNumber || "—"}
              </span>
              <StatusBadge status={entry.status || "draft"} labelMap={ENTRY_STATUS_LABELS} size="sm" />
              <Badge
                variant="outline"
                className={
                  entry.isBalanced
                    ? "border-cipher-mint/25 bg-cipher-mint/10 text-cipher-mint"
                    : "border-ember/25 bg-ember/10 text-ember"
                }
              >
                {entry.isBalanced ? "تراز" : "نا تراز"}
              </Badge>
            </div>
            <p className="text-sm text-fog">{entry.description || "بدون شرح"}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-fog/60">
              <span>تاریخ سند: {formatJalaliDate(entry.entryDate)}</span>
              {entry.reference && <span>مرجع: {entry.reference}</span>}
              <span>دوره: {entry.period?.name || entry.period?.code || "—"}</span>
              {entry.postedAt && <span>ثبت: {formatJalaliDateTime(entry.postedAt)}</span>}
            </div>
          </div>
          <div className="text-sm">
            <p className="mb-1 text-fog/60">منبع سند</p>
            <SourceLink sourceType={entry.sourceType} sourceId={entry.sourceId} mode={mode} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 border-t border-steel-border/20 pt-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white/[0.02] p-3">
            <p className="text-xs text-fog/60">جمع بدهکار</p>
            <p className="mt-1 font-mono text-base font-semibold text-moonlight tabular-nums" dir="ltr">
              {formatRial(entry.totalDebit)}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.02] p-3">
            <p className="text-xs text-fog/60">جمع بستانکار</p>
            <p className="mt-1 font-mono text-base font-semibold text-moonlight tabular-nums" dir="ltr">
              {formatRial(entry.totalCredit)}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.02] p-3">
            <p className="text-xs text-fog/60">وضعیت تراز</p>
            <p className="mt-1 text-base font-semibold text-moonlight">
              {labelOf({ true: "تراز", false: "نا تراز" }, String(!!entry.isBalanced))}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-moonlight">ردیف‌های سند</h2>
        <LinesTable lines={lines} />
      </div>

      {snapshot.length > 0 && (
        <details className="glass-card rounded-xl p-4">
          <summary className="cursor-pointer text-sm text-fog hover:text-moonlight">
            نسخه ثبت‌شده (Audit Snapshot)
          </summary>
          {changed && (
            <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              اسناد اصلی تغییر کرده‌اند؛ نسخه ثبت‌شده مرجع نهایی است.
            </p>
          )}
          <div className="mt-3">
            <LinesTable lines={snapshot} />
          </div>
        </details>
      )}
    </div>
  )
}

export { JournalEntryDetail }
