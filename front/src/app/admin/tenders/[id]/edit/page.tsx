import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/tender/get"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { TenderEditClient } from "./tender-edit-client"

interface Props {
  params: Promise<{ id: string }>
}

const PROJECTION = {
  _id: 1,
  title: 1,
  description: 1,
  status: 1,
  deadline: 1,
  purchasingRequest: { _id: 1, title: 1 },
} as const

export default async function EditTenderPage({ params }: Props) {
  const { id } = await params
  const result = await get({ _id: id }, PROJECTION)
  const item = result.success && result.body?.[0] ? result.body[0] : null

  if (!item) {
    return (
      <div>
        <ErrorState
          title="مناقصه یافت نشد"
          message="مناقصه با این شناسه در سامانه وجود ندارد."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/admin/tenders">
            <Button variant="ghost" className="gap-2 px-4">
              <ArrowRight className="size-5" />
              بازگشت به مناقصات
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <TenderEditClient tender={item} />
}
