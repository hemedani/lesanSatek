import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/unit/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { UnitEditClient } from "./unit-edit-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditUnitPage({ params }: Props) {
  const { id } = await params

  const result = await get(
    { _id: id },
    {
      _id: 1,
      name: 1,
      enName: 1,
      description: 1,
      type: 1,
      isActive: 1,
      address: 1,
      phone: 1,
      email: 1,
      warehouseCapacity: 1,
      hasColdStorage: 1,
      fleetSize: 1,
      serviceRadius: 1,
      location: 1,
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

  return <UnitEditClient unit={unit} />
}
