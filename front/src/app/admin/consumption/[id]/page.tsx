import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/consumption/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { ConsumptionDetailClient } from "./consumption-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

const CONSUMPTION_PROJECTION = {
  _id: 1,
  quantity: 1,
  consumedAt: 1,
  reason: 1,
  consumedFor: 1,
  notes: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1, type: 1 },
  consumedBy: { _id: 1, first_name: 1, last_name: 1 },
  inventory: { _id: 1, quantity: 1 },
  ware: { _id: 1, name: 1, enName: 1, brand: 1 },
  wareModel: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareType: { _id: 1, name: 1 },
} as const

export default async function ConsumptionDetailPage({ params }: Props) {
  const { id } = await params

  const itemResult = await get({ _id: id }, CONSUMPTION_PROJECTION)
  const item = itemResult.success ? itemResult.body?.[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="مصرف یافت نشد"
          message="مصرفی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/consumption">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به مصرف
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <ConsumptionDetailClient item={item} />
}