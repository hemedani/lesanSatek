import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/unit/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { UnitRelationsClient } from "./unit-relations-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function UnitRelationsPage({ params }: Props) {
  const { id } = await params

  const result = await get(
    { _id: id },
    {
      _id: 1,
      name: 1,
      organization: { _id: 1, name: 1 },
      parentUnit: { _id: 1, name: 1 },
      head: { _id: 1, first_name: 1, last_name: 1 },
    }
  )

  const unit = result.success && result.body?.[0] ? result.body[0] : null

  if (!unit) {
    return (
      <div>
        <ErrorState
          title="واحد مورد نظر یافت نشد"
          message="واحدی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/units">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به واحدها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <UnitRelationsClient unit={unit} />
}
