import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { gets as getBudgetLines } from "@/app/actions/budgetLine/gets"
import { BudgetReportList } from "./budget-report-list"

interface BudgetLineItem {
  _id: string
  code?: string
  title?: string
  description?: string
  totalAllocated?: number
  totalEncumbered?: number
  totalSpent?: number
  remainingBudget?: number
}

export default async function UnitHeadFinanceBudgetReportsPage() {
  const result = await getBudgetLines(
    { page: 1, limit: 100 },
    {
      _id: 1, code: 1, title: 1, description: 1,
      totalAllocated: 1, totalEncumbered: 1, totalSpent: 1, remainingBudget: 1,
    },
  )

  const items: BudgetLineItem[] = result.success ? result.body || [] : []

  return (
    <div className="space-y-6">
      <Link
        href="/unit-head/finance"
        className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors"
      >
        <ArrowLeft className="size-4" />
        بازگشت به امور مالی
      </Link>

      <PageHeader title="گزارش بودجه" description="خلاصه وضعیت بودجه سازمان" />

      <BudgetReportList items={items} />
    </div>
  )
}
