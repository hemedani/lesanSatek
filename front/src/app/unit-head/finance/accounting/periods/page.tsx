import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { PeriodsClient } from "@/components/accounting/periods-client"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { buildPageUrls, pageCount } from "@/components/accounting/server/utils"
import { asArray, readCount } from "@/components/accounting/types"
import type { AccountingPeriod } from "@/components/accounting/types"
import { count } from "@/app/actions/accountingPeriod/count"
import { gets } from "@/app/actions/accountingPeriod/gets"

const BASE_PATH = "/unit-head/finance/accounting"
const LIMIT = 20

export default async function PeriodsPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string; page?: string; search?: string; status?: string }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("unit-head", readSearchParam(params.organizationId))

  if (!context.allowed) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="دوره‌های حسابداری" context={context} />
        <AccountingDenied context={context} />
      </div>
    )
  }

  const page = Math.max(1, Number(params.page) || 1)
  const search = readSearchParam(params.search)
  const status = readSearchParam(params.status)
  const filters = {
    organizationId: context.organizationId,
    ...(search ? { code: search } : {}),
    ...(status ? { status } : {}),
  }

  const [listResult, countResult] = await Promise.all([
    gets(
      { ...filters, page, limit: LIMIT, sortBy: "code", sortOrder: "desc" },
      {
        _id: 1,
        code: 1,
        name: 1,
        startDate: 1,
        endDate: 1,
        status: 1,
        closedAt: 1,
        closedBy: { _id: 1, first_name: 1, last_name: 1 },
      },
    ),
    count(filters),
  ])

  const periods = listResult.success ? asArray<AccountingPeriod>(listResult.body) : []
  const total = countResult.success ? readCount(countResult.body) : periods.length
  const totalPages = pageCount(total, LIMIT)
  const urlParams = new URLSearchParams()
  if (search) urlParams.set("search", search)
  if (status) urlParams.set("status", status)
  if (context.organizationId) urlParams.set("organizationId", context.organizationId)
  const { prevUrl, nextUrl } = buildPageUrls(`${BASE_PATH}/periods`, urlParams, page, totalPages)

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="دوره‌های حسابداری"
        description="مدیریت دوره‌های مالی، بستن دوره و جلوگیری از ثبت سند در دوره‌های بسته"
        context={context}
      />
      <PeriodsClient
        periods={periods}
        basePath={BASE_PATH}
        canManage={context.canManage}
        canClose={context.canClosePeriod}
        organizations={context.organizations}
        organizationId={context.organizationId}
        search={search}
        status={status}
        prevUrl={prevUrl}
        nextUrl={nextUrl}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}
