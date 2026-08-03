import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/ware/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { WareRelationsClient } from "./ware-relations-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function WareRelationsPage({ params }: Props) {
  const { id } = await params

  const result = await get(
    { _id: id },
    {
      _id: 1,
      name: 1,
      enName: 1,
      manufacturer: { _id: 1, name: 1 },
      wareType: { _id: 1, name: 1 },
      wareClass: { _id: 1, name: 1 },
      wareGroup: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
    }
  )

  const ware = result.success && result.body?.[0] ? result.body[0] : null

  if (!ware) {
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

  return <WareRelationsClient ware={ware} />
}
