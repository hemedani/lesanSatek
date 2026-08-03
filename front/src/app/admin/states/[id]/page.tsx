import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/state/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { StateForm } from "../state-form"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  name: 1,
  enName: 1,
} as const

export default async function EditStatePage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="استان یافت نشد"
          message="استانی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/states">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به استان‌ها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <StateForm item={item} />
}
