import Link from "next/link"
import { ArrowRight, ScrollText } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { gets as getConsumptions } from "@/app/actions/consumption/gets"
import { ConsumptionClient } from "./consumption-client"

export default async function UnitHeadConsumptionPage() {
  const result = await getConsumptions(
    { page: 1, limit: 100 },
    { _id: 1, quantity: 1, notes: 1, reason: 1, consumedFor: 1, consumedAt: 1, createdAt: 1, unit: { _id: 1, name: 1 }, ware: { _id: 1, name: 1 }, wareModel: { _id: 1, name: 1 }, consumedBy: { _id: 1, first_name: 1 } },
  )

  const items = result.success ? result.body || [] : []

  return (
    <div className="space-y-6">
      <Link href="/unit-head" className="inline-flex items-center gap-1 text-sm text-fog hover:text-glacier transition-colors">
        <ArrowRight className="size-4" />
        بازگشت به داشبورد
      </Link>
      <PageHeader title="مصرف کالا" description="ثبت و مشاهده مصرف کالا در واحد" />
      <ConsumptionClient items={items} />
    </div>
  )
}
