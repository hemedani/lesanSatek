import Link from "next/link"

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
import { ENTRY_STATUS_LABELS, SOURCE_TYPE_LABELS, labelOf } from "@/components/accounting/labels"
import { formatJalaliDate, formatRial } from "@/components/accounting/money"
import type { JournalEntry } from "@/components/accounting/types"

interface JournalEntryTableProps {
  entries: JournalEntry[]
  basePath: string
}

function JournalEntryTable({ entries, basePath }: JournalEntryTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-steel-border/25">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#282c35]">
            <TableHead className="text-caption text-fog/80">شماره سند</TableHead>
            <TableHead className="text-caption text-fog/80">تاریخ</TableHead>
            <TableHead className="text-caption text-fog/80">منبع</TableHead>
            <TableHead className="text-caption text-fog/80">شرح / مرجع</TableHead>
            <TableHead className="text-caption text-fog/80">بدهکار</TableHead>
            <TableHead className="text-caption text-fog/80">بستانکار</TableHead>
            <TableHead className="text-caption text-fog/80">وضعیت</TableHead>
            <TableHead className="text-caption text-fog/80">تراز</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry._id} className="hover:bg-white/[0.02]">
              <TableCell>
                <Link
                  href={`${basePath}/journal-entries/${entry._id}`}
                  dir="ltr"
                  className="font-mono text-sm text-frost-link transition-colors hover:text-electric-iris"
                >
                  {entry.entryNumber || "—"}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-fog/80">{formatJalaliDate(entry.entryDate)}</TableCell>
              <TableCell className="whitespace-nowrap text-fog/80">
                {labelOf(SOURCE_TYPE_LABELS, entry.sourceType)}
              </TableCell>
              <TableCell className="max-w-64">
                <span className="block truncate text-moonlight">{entry.description || "—"}</span>
                {entry.reference && <span className="block truncate text-xs text-fog/50">{entry.reference}</span>}
              </TableCell>
              <TableCell className="whitespace-nowrap text-end font-mono tabular-nums text-moonlight" dir="ltr">
                {formatRial(entry.totalDebit)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-end font-mono tabular-nums text-moonlight" dir="ltr">
                {formatRial(entry.totalCredit)}
              </TableCell>
              <TableCell>
                <StatusBadge status={entry.status || "draft"} labelMap={ENTRY_STATUS_LABELS} size="sm" />
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { JournalEntryTable }
