import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/wareGroup/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { WareGroupRelationsClient } from "./ware-group-relations-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function WareGroupRelationsPage({ params }: Props) {
  const { id } = await params

  const result = await get(
    { _id: id },
    {
      _id: 1,
      name: 1,
      enName: 1,
      wareType: { _id: 1, name: 1 },
      wareClasses: { _id: 1, name: 1 },
    }
  )

  const group = result.success && result.body?.[0] ? result.body[0] : null

  if (!group) {
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

  return <WareGroupRelationsClient group={group} />
}
