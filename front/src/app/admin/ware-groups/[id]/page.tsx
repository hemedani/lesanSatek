import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/wareGroup/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { WareGroupForm } from "../ware-group-form"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  name: 1,
  enName: 1,
  wareType: { _id: 1, name: 1 },
  wareClasses: { _id: 1, name: 1 },
} as const

export default async function EditWareGroupPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="گروه کالا یافت نشد"
          message="گروه کالایی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/ware-groups">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به گروه‌های کالا
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <WareGroupForm
      item={{
        _id: item._id,
        name: item.name,
        enName: item.enName,
        wareType: item.wareType,
        wareClasses: item.wareClasses,
      }}
    />
  )
}
