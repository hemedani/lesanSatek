import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/city/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { CityRelationsClient } from "./city-relations-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function CityRelationsPage({ params }: Props) {
  const { id } = await params

  const result = await get(
    { _id: id },
    {
      _id: 1,
      name: 1,
      state: { _id: 1, name: 1 },
    }
  )

  const city = result.success && result.body?.[0] ? result.body[0] : null

  if (!city) {
    return (
      <div>
        <ErrorState
          title="شهر مورد نظر یافت نشد"
          message="شهری با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/cities">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به شهرها
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <CityRelationsClient city={city} />
}
