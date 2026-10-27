import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { CostCentersClient } from "@/components/accounting/cost-centers-client"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { buildPageUrls, pageCount } from "@/components/accounting/server/utils"
import { asArray, readCount } from "@/components/accounting/types"
import type { CostCenter } from "@/components/accounting/types"
import { count } from "@/app/actions/costCenter/count"
import { gets } from "@/app/actions/costCenter/gets"

const BASE_PATH = "/unit-head/finance/accounting"
const LIMIT = 20

export default async function CostCentersPage({
  searchParams,
}: {
  searchParams: Promise<{
    organizationId?: string
    page?: string
    search?: string
    type?: string
    isActive?: string
  }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("unit-head", readSearchParam(params.organizationId))

  if (!context.allowed) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="مراکز هزینه" context={context} />
        <AccountingDenied context={context} />
      </div>
    )
  }

  const page = Math.max(1, Number(params.page) || 1)
  const search = readSearchParam(params.search)
  const type = readSearchParam(params.type)
  const isActive = readSearchParam(params.isActive)
  const filters = {
    organizationId: context.organizationId,
    ...(search ? { code: search } : {}),
    ...(type ? { type } : {}),
    ...(isActive ? { isActive: isActive === "true" } : {}),
  }

  const [listResult, countResult] = await Promise.all([
    gets(
      { ...filters, page, limit: LIMIT, sortBy: "code", sortOrder: "asc" },
      {
        _id: 1,
        code: 1,
        name: 1,
        description: 1,
        type: 1,
        isActive: 1,
        unit: { _id: 1, name: 1 },
        responsibleUser: { _id: 1, first_name: 1, last_name: 1 },
      },
    ),
    count(filters),
  ])

  const costCenters = listResult.success ? asArray<CostCenter>(listResult.body) : []
  const total = countResult.success ? readCount(countResult.body) : costCenters.length
  const totalPages = pageCount(total, LIMIT)
  const urlParams = new URLSearchParams()
  if (search) urlParams.set("search", search)
  if (type) urlParams.set("type", type)
  if (isActive) urlParams.set("isActive", isActive)
  if (context.organizationId) urlParams.set("organizationId", context.organizationId)
  const { prevUrl, nextUrl } = buildPageUrls(`${BASE_PATH}/cost-centers`, urlParams, page, totalPages)

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="مراکز هزینه"
        description="تعریف مراکز هزینه و مسئولان آن‌ها برای تخصیص بهتر هزینه‌ها"
        context={context}
      />
      <CostCentersClient
        costCenters={costCenters}
        basePath={BASE_PATH}
        canManage={context.canManage}
        organizations={context.organizations}
        organizationId={context.organizationId}
        search={search}
        type={type}
        isActive={isActive}
        prevUrl={prevUrl}
        nextUrl={nextUrl}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}
