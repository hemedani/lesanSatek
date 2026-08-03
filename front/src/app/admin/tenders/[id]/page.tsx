import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { get } from "@/app/actions/tender/get"
import { gets as getOffers } from "@/app/actions/tenderOffer/gets"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/ui/error-state"
import { TenderDetailClient } from "./tender-detail-client"

interface Props {
  params: Promise<{ id: string }>
}

export default async function TenderDetailPage({ params }: Props) {
  const { id } = await params

  const [tenderResult, offersResult] = await Promise.all([
    get(
      { _id: id },
      {
        _id: 1,
        title: 1,
        description: 1,
        status: 1,
        deadline: 1,
        createdAt: 1,
        purchasingRequest: { _id: 1, title: 1 },
      }
    ),
    getOffers(
      { activeRoleId: "", tenderId: id, page: 1, limit: 100 },
      {
        _id: 1,
        price: 1,
        deliveryTime: 1,
        paymentTerms: 1,
        status: 1,
        description: 1,
        submittedAt: 1,
        store: { _id: 1, name: 1 },
      }
    ),
  ])

  const tender = tenderResult.success ? tenderResult.body?.[0] : null

  if (!tender) {
    return (
      <div>
        <ErrorState
          title="مناقصه یافت نشد"
          message="مناقصه‌ای با این شناسه در سامانه وجود ندارد."
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

  const offers = offersResult.success && Array.isArray(offersResult.body) ? offersResult.body : []

  return <TenderDetailClient tender={tender} offers={offers} />
}
