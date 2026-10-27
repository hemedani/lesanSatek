import { notFound } from "next/navigation"

import { AccountingDenied } from "@/components/accounting/accounting-denied"
import { AccountingPageHeader } from "@/components/accounting/accounting-page-header"
import { AccountForm } from "@/components/accounting/account-form"
import { resolveAccountingContext, readSearchParam } from "@/components/accounting/server/context"
import { asArray } from "@/components/accounting/types"
import type { Account } from "@/components/accounting/types"
import { get } from "@/app/actions/account/get"
import { gets } from "@/app/actions/account/gets"

export default async function EditAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ organizationId?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const context = await resolveAccountingContext("admin", readSearchParam(query.organizationId))

  if (!context.allowed || !context.canManage) {
    return (
      <div className="space-y-6">
        <AccountingPageHeader title="ویرایش حساب" context={context} />
        <AccountingDenied context={context.allowed ? { ...context, denial: "no-feature" } : context} />
      </div>
    )
  }

  const [accountResult, listResult] = await Promise.all([
    get({ _id: id }, {
      _id: 1,
      code: 1,
      name: 1,
      enName: 1,
      description: 1,
      accountType: 1,
      normalBalance: 1,
      systemKey: 1,
      level: 1,
      isPostable: 1,
      isActive: 1,
      isSystem: 1,
      parentAccount: { _id: 1, code: 1, name: 1 },
    }),
    gets(
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
    ),
  ])

  const account = accountResult.success ? asArray<Account>(accountResult.body)[0] : null
  if (!account) notFound()
  const accounts = listResult.success ? asArray<Account>(listResult.body) : []

  return (
    <div className="space-y-6">
      <AccountingPageHeader
        title={`ویرایش حساب ${account.code || ""}`}
        description={account.name}
        context={context}
      />
      <div className="glass-card rounded-2xl p-5">
        <AccountForm
          organizationId={context.organizationId}
          accounts={accounts}
          initial={account}
          basePath="/admin/accounting"
        />
      </div>
    </div>
  )
}
