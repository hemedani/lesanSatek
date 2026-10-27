import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { JournalEntryDetail } from "@/components/accounting/journal-entry-detail"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import type { JournalEntry } from "@/components/accounting/types"
import { get } from "@/app/actions/journalEntry/get"

export default async function JournalEntryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ organizationId?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const context = await resolveAccountingContext("unit-head", readSearchParam(query.organizationId))

  if (!context.allowed) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="جزئیات سند" context={context} />
        <AccountingDenied context={context} />
      </div>
    )
  }

  const result = await get(
    { _id: id },
    {
      _id: 1,
      entryNumber: 1,
      entryDate: 1,
      description: 1,
      reference: 1,
      sourceType: 1,
      sourceId: 1,
      sourceEvent: 1,
      status: 1,
      totalDebit: 1,
      totalCredit: 1,
      isBalanced: 1,
      postedAt: 1,
      lineSnapshot: 1,
      period: { _id: 1, code: 1, name: 1, status: 1 },
      createdBy: { _id: 1, first_name: 1, last_name: 1 },
      lines: {
        _id: 1,
        lineNumber: 1,
        description: 1,
        debit: 1,
        credit: 1,
        account: { _id: 1, code: 1, name: 1, accountType: 1 },
        costCenter: { _id: 1, code: 1, name: 1 },
        store: { _id: 1, name: 1 },
      },
    },
  )

  const entry = result.success ? asArray<JournalEntry>(result.body)[0] : null
  if (!entry) notFound()

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="جزئیات سند"
        description="اسناد حسابداری تغییرناپذیرند و قابل ویرایش یا حذف نیستند."
        context={context}
      >
        <Button render={<Link href="/unit-head/finance/accounting/journal-entries" />} variant="outline" className="gap-2">
          <ArrowRight className="size-4" />
          بازگشت به فهرست
        </Button>
      </AccountingPageHeader>
      <JournalEntryDetail entry={entry} mode="unit-head" />
    </div>
  )
}
