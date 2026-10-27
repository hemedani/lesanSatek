import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { JournalEntriesClient } from "@/components/accounting/journal-entries-client"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { buildPageUrls, pageCount } from "@/components/accounting/server/utils"
import { asArray, readCount } from "@/components/accounting/types"
import type { AccountingPeriod, JournalEntry } from "@/components/accounting/types"
import { count } from "@/app/actions/journalEntry/count"
import { gets } from "@/app/actions/journalEntry/gets"
import { gets as getPeriods } from "@/app/actions/accountingPeriod/gets"

const BASE_PATH = "/admin/accounting"
const LIMIT = 20

export default async function JournalEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    organizationId?: string
    page?: string
    entryNumber?: string
    periodId?: string
    sourceType?: string
    status?: string
    startDate?: string
    endDate?: string
  }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("admin", readSearchParam(params.organizationId))

  if (!context.allowed) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="اسناد حسابداری" context={context} />
        <AccountingDenied context={context} />
      </div>
    )
  }

  const page = Math.max(1, Number(params.page) || 1)
  const entryNumber = readSearchParam(params.entryNumber)
  const periodId = readSearchParam(params.periodId)
  const sourceType = readSearchParam(params.sourceType)
  const status = readSearchParam(params.status)
  const startDate = readSearchParam(params.startDate)
  const endDate = readSearchParam(params.endDate)

  const filters = {
    organizationId: context.organizationId,
    ...(entryNumber ? { entryNumber } : {}),
    ...(periodId ? { periodId } : {}),
    ...(sourceType ? { sourceType } : {}),
    ...(status ? { status } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  }

  const [entriesResult, countResult, periodsResult] = await Promise.all([
    gets(
      { ...filters, page, limit: LIMIT, sortBy: "entryDate", sortOrder: "desc" },
      {
        _id: 1,
        entryNumber: 1,
        entryDate: 1,
        description: 1,
        reference: 1,
        sourceType: 1,
        status: 1,
        totalDebit: 1,
        totalCredit: 1,
        isBalanced: 1,
      },
    ),
    count(filters),
    getPeriods(
      { organizationId: context.organizationId, page: 1, limit: 200, sortBy: "code", sortOrder: "desc" },
      { _id: 1, code: 1, name: 1, status: 1 },
    ),
  ])

  const entries = entriesResult.success ? asArray<JournalEntry>(entriesResult.body) : []
  const total = countResult.success ? readCount(countResult.body) : entries.length
  const totalPages = pageCount(total, LIMIT)
  const periods = periodsResult.success ? asArray<AccountingPeriod>(periodsResult.body) : []

  const urlParams = new URLSearchParams()
  if (entryNumber) urlParams.set("entryNumber", entryNumber)
  if (periodId) urlParams.set("periodId", periodId)
  if (sourceType) urlParams.set("sourceType", sourceType)
  if (status) urlParams.set("status", status)
  if (startDate) urlParams.set("startDate", startDate)
  if (endDate) urlParams.set("endDate", endDate)
  if (context.organizationId) urlParams.set("organizationId", context.organizationId)
  const { prevUrl, nextUrl } = buildPageUrls(`${BASE_PATH}/journal-entries`, urlParams, page, totalPages)

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="اسناد حسابداری"
        description="فهرست اسناد ثبت‌شده؛ اسناد حسابداری تغییرناپذیر هستند."
        context={context}
      />
      <JournalEntriesClient
        entries={entries}
        periods={periods}
        basePath={BASE_PATH}
        canPostManual={context.canPostManual}
        organizations={context.organizations}
        organizationId={context.organizationId}
        search={entryNumber}
        periodId={periodId}
        sourceType={sourceType}
        status={status}
        startDate={startDate}
        endDate={endDate}
        prevUrl={prevUrl}
        nextUrl={nextUrl}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}
