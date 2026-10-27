import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { AccountsClient } from "@/components/accounting/accounts-client"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { buildPageUrls, pageCount } from "@/components/accounting/server/utils"
import { asArray, readCount } from "@/components/accounting/types"
import type { Account } from "@/components/accounting/types"
import { count } from "@/app/actions/account/count"
import { gets } from "@/app/actions/account/gets"

const BASE_PATH = "/admin/accounting"
const LIMIT = 20

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{
    organizationId?: string
    page?: string
    search?: string
    accountType?: string
    systemKey?: string
    isActive?: string
  }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("admin", readSearchParam(params.organizationId))

  if (!context.allowed) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="کدینگ حساب‌ها" context={context} />
        <AccountingDenied context={context} />
      </div>
    )
  }

  const page = Math.max(1, Number(params.page) || 1)
  const search = readSearchParam(params.search)
  const accountType = readSearchParam(params.accountType)
  const systemKey = readSearchParam(params.systemKey)
  const isActive = readSearchParam(params.isActive)

  const filters = {
    organizationId: context.organizationId,
    ...(search ? (/^\d/.test(search) ? { code: search } : { name: search }) : {}),
    ...(accountType ? { accountType } : {}),
    ...(systemKey ? { systemKey } : {}),
    ...(isActive ? { isActive: isActive === "true" } : {}),
  }

  const [listResult, countResult] = await Promise.all([
    gets(
      { ...filters, page, limit: LIMIT, sortBy: "code", sortOrder: "asc" },
      {
        _id: 1,
        code: 1,
        name: 1,
        enName: 1,
        accountType: 1,
        normalBalance: 1,
        systemKey: 1,
        level: 1,
        isPostable: 1,
        isActive: 1,
        isSystem: 1,
        parentAccount: { _id: 1, code: 1, name: 1 },
      },
    ),
    count(filters),
  ])

  const accounts = listResult.success ? asArray<Account>(listResult.body) : []
  const total = countResult.success ? readCount(countResult.body) : accounts.length
  const totalPages = pageCount(total, LIMIT)
  const urlParams = new URLSearchParams()
  if (search) urlParams.set("search", search)
  if (accountType) urlParams.set("accountType", accountType)
  if (systemKey) urlParams.set("systemKey", systemKey)
  if (isActive) urlParams.set("isActive", isActive)
  if (context.organizationId) urlParams.set("organizationId", context.organizationId)
  const { prevUrl, nextUrl } = buildPageUrls(`${BASE_PATH}/accounts`, urlParams, page, totalPages)

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="کدینگ حساب‌ها"
        description="ساختار درختی حساب‌های سازمان و کنترل حساب‌های قابل ثبت"
        context={context}
      />
      <AccountsClient
        accounts={accounts}
        basePath={BASE_PATH}
        canManage={context.canManage}
        organizations={context.organizations}
        organizationId={context.organizationId}
        search={search}
        accountType={accountType}
        isActive={isActive}
        systemKey={systemKey}
        prevUrl={prevUrl}
        nextUrl={nextUrl}
        page={page}
        totalPages={totalPages}
        total={total}
      />
    </div>
  )
}
