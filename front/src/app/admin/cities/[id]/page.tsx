import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/city/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { CityEditClient } from "./city-edit-client"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  name: 1,
  enName: 1,
} as const

export default async function EditCityPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="شهر یافت نشد"
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

  return <CityEditClient city={item} />
}
