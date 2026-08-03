import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/manufacturer/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { ManufacturerForm } from "../manufacturer-form"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = { _id: 1, name: 1, enName: 1, country: 1 } as const

export default async function EditManufacturerPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="تولیدکننده یافت نشد"
          message="تولیدکننده‌ای با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/manufacturers">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به تولیدکنندگان
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ManufacturerForm
      item={{
        _id: item._id,
        name: item.name,
        enName: item.enName,
        country: item.country,
      }}
    />
  )
}
