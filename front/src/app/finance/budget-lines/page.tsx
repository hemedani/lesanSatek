import Link from "next/link"
import { Calculator } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageHeader } from "@/components/ui/page-header"
import { DataTable } from "@/components/ui/data-table"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { gets as getBudgetLines } from "@/app/actions/budgetLine/gets"

const statusMap: Record<string, string> = {
  active: "فعال",
  consumed: "مصرف شده",
  closed: "بسته شده",
}

interface BudgetLineItem {
  _id: string
  code?: string
  description?: string
  totalAmount?: number
  remainingAmount?: number
  status?: string
  fiscalYear?: { _id: string; name?: string }
}

function remainingColor(remaining?: number, total?: number) {
  if (!remaining || !total) return "text-fog"
  const ratio = remaining / total
  if (ratio <= 0.1) return "text-ember"
  if (ratio <= 0.3) return "text-amber-400"
  return "text-emerald-400"
}

const columns = [
  {
    key: "code",
    label: "کد",
    render: (item: BudgetLineItem) => (
      <span className="text-moonlight font-mono font-medium">{item.code || "—"}</span>
    ),
  },
  { key: "description", label: "شرح", render: (item: BudgetLineItem) => item.description || "—" },
  {
    key: "totalAmount",
    label: "مبلغ کل",
    render: (item: BudgetLineItem) => `${(item.totalAmount || 0).toLocaleString("fa-IR")} تومان`,
  },
  {
    key: "remainingAmount",
    label: "باقی‌مانده",
    render: (item: BudgetLineItem) => (
      <span className={`font-medium ${remainingColor(item.remainingAmount, item.totalAmount)}`}>
        {(item.remainingAmount || 0).toLocaleString("fa-IR")} تومان
      </span>
    ),
  },
  {
    key: "status",
    label: "وضعیت",
    render: (item: BudgetLineItem) => (
      <StatusBadge status={item.status || "active"} labelMap={statusMap} />
    ),
  },
  {
    key: "fiscalYear",
    label: "سال مالی",
    render: (item: BudgetLineItem) => item.fiscalYear?.name || "—",
  },
]

export default async function FinanceBudgetLinesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const page = Number(resolvedSearchParams.page) || 1
  const limit = 20

  const result = await getBudgetLines(
    { page, limit },
    {
      _id: 1,
      code: 1,
      description: 1,
      totalAmount: 1,
      remainingAmount: 1,
      status: 1,
      fiscalYear: { _id: 1, name: 1 },
    },
  )

  const items: BudgetLineItem[] = result.success ? result.body || [] : []
  const prevPageUrl = page > 1 ? `/finance/budget-lines?page=${page - 1}` : ""
  const nextPageUrl = items.length >= limit ? `/finance/budget-lines?page=${page + 1}` : ""

  return (
    <div className="space-y-6">
      <PageHeader title="ردیف‌های بودجه" description="مشاهده ردیف‌های بودجه" />

      {items.length === 0 ? (
        <Card variant="glass">
          <CardContent className="py-12">
            <EmptyState icon={Calculator} title="ردیف بودجه‌ای یافت نشد" description="هیچ ردیف بودجه‌ای ثبت نشده است" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card variant="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-fog">{items.length} ردیف</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={columns} data={items} keyExtractor={(item: BudgetLineItem) => item._id} />
            </CardContent>
          </Card>
          <Pagination prevPageUrl={prevPageUrl} nextPageUrl={nextPageUrl} currentPage={page} />
        </>
      )}
    </div>
  )
}
