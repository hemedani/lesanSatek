import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/wareClass/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { WareClassForm } from "../ware-class-form"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = { _id: 1, name: 1, enName: 1, wareType: { _id: 1, name: 1 } } as const

export default async function EditWareClassPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="کلاس کالا یافت نشد"
          message="کلاس کالایی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/ware-classes">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به کلاس‌های کالا
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <WareClassForm
      item={{
        _id: item._id,
        name: item.name,
        enName: item.enName,
        wareType: item.wareType,
      }}
    />
  )
}
