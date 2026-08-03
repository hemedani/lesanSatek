import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/budgetLine/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { BudgetLineRelationsClient } from "./budget-line-relations-client"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  code: 1,
  title: 1,
  fiscalYear: { _id: 1, name: 1 },
  organization: { _id: 1, name: 1 },
  unit: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

export default async function BudgetLineRelationsPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="ردیف بودجه یافت نشد"
          message="ردیف بودجه‌ای با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/budget-lines">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به ردیف‌های بودجه
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <BudgetLineRelationsClient budgetLine={item} />
}
