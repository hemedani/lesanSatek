import { PageHeader } from "@/components/ui/page-header"
import { OrganizationSelector } from "@/components/accounting/organization-selector"
import type { AccountingContext } from "@/components/accounting/server/context"

interface AccountingPageHeaderProps {
  title: string
  description?: string
  context: AccountingContext
  children?: React.ReactNode
}

function AccountingPageHeader({
  title,
  description,
  context,
  children,
}: AccountingPageHeaderProps) {
  return (
    <PageHeader title={title} description={description}>
      {context.mode === "admin" && context.organizations.length > 1 && (
        <OrganizationSelector
          organizations={context.organizations}
          value={context.organizationId}
        />
      )}
      {children}
    </PageHeader>
  )
}

export { AccountingPageHeader }
