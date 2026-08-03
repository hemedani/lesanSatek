import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/store/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { StoreRelationsClient } from "./store-relations-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function StoreRelationsPage({ params }: Props) {
  const { id } = await params

  const result = await get(
    { _id: id },
    {
      _id: 1,
      name: 1,
      storeHead: { _id: 1, first_name: 1, last_name: 1 },
      city: { _id: 1, name: 1 },
      state: { _id: 1, name: 1 },
      wareTypes: { _id: 1, name: 1 },
    }
  )

  const store = result.success && result.body?.[0] ? result.body[0] : null

  if (!store) {
    return (
      <div>
        <ErrorState
          title="فروشگاه یافت نشد"
          message="فروشگاهی با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/stores">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به فروشگاه‌ها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <StoreRelationsClient store={store} />
}
