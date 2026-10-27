import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { AccountForm } from "@/components/accounting/account-form"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import type { Account } from "@/components/accounting/types"
import { gets } from "@/app/actions/account/gets"

export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ organizationId?: string }>
}) {
  const params = await searchParams
  const context = await resolveAccountingContext("unit-head", readSearchParam(params.organizationId))

  if (!context.allowed || !context.canManage) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="حساب جدید" context={context} />
        <AccountingDenied context={context.allowed ? { ...context, denial: "no-feature" } : context} />
      </div>
    )
  }

  const result = await gets(
    { organizationId: context.organizationId, page: 1, limit: 500, sortBy: "code", sortOrder: "asc" },
    {
      _id: 1,
      code: 1,
      name: 1,
      accountType: 1,
      normalBalance: 1,
      level: 1,
      isPostable: 1,
      isActive: 1,
      isSystem: 1,
      parentAccount: { _id: 1, code: 1, name: 1 },
    },
  )
  const accounts = result.success ? asArray<Account>(result.body) : []

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title="حساب جدید"
        description="افزودن حساب به کدینگ حساب‌های سازمان"
        context={context}
      />
      <div className="glass-card rounded-2xl p-5">
        <AccountForm
          organizationId={context.organizationId}
          accounts={accounts}
          basePath="/unit-head/finance/accounting"
        />
      </div>
    </div>
  )
}
