import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/fiscalYear/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { FiscalYearRelationsClient } from "./fiscal-year-relations-client"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  name: 1,
  organization: { _id: 1, name: 1 },
} as const

export default async function FiscalYearRelationsPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="سال مالی یافت نشد"
          message="سال مالی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/fiscal-years">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به سال‌های مالی
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <FiscalYearRelationsClient fiscalYear={item} />
}
