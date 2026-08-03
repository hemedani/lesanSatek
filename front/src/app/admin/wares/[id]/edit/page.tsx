import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/ware/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { WareForm } from "../../ware-form"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  name: 1,
  enName: 1,
  brand: 1,
  price: 1,
  orderedNumber: 1,
  irc: 1,
  umdns: 1,
  gtin: 1,
  wareType: { _id: 1, name: 1 },
  wareClass: { _id: 1, name: 1 },
  wareGroup: { _id: 1, name: 1 },
  wareModel: { _id: 1, name: 1 },
  manufacturer: { _id: 1, name: 1 },
} as const

export default async function EditWarePage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="کالا یافت نشد"
          message="کالایی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/wares">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به کالاها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <WareForm
      item={{
        _id: item._id,
        name: item.name,
        enName: item.enName,
        brand: item.brand,
        price: item.price,
        orderedNumber: item.orderedNumber,
        irc: item.irc,
        umdns: item.umdns,
        gtin: item.gtin,
        wareType: item.wareType,
        wareClass: item.wareClass,
        wareGroup: item.wareGroup,
        wareModel: item.wareModel,
        manufacturer: item.manufacturer,
      }}
    />
  )
}
