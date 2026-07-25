import { get } from "@/app/actions/purchasingRequest/get"
import { OrgHeadPRDetailClient } from "./orghead-pr-detail-client"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrgHeadPRDetailPage({ params }: PageProps) {
  const { id } = await params

  const result = await get(
    { _id: id, activeRoleId: "" },
    {
      _id: 1,
      title: 1,
      description: 1,
      status: 1,
      currentStep: 1,
      quantity: 1,
      estimatedAmount: 1,
      selectionType: 1,
      stuffStatus: 1,
      selectedTenderOfferId: 1,
      finalizedAt: 1,
      completedAt: 1,
      createdAt: 1,
      organization: { _id: 1, name: 1, enName: 1 },
      requester: { _id: 1, first_name: 1, last_name: 1 },
      requestingUnit: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
      budgetLine: { _id: 1, code: 1, title: 1, totalAllocated: 1, totalEncumbered: 1 },
      store: { _id: 1, name: 1 },
      stuff: { _id: 1, quantity: 1, price: 1, hasAbsolutePrice: 1, pricePercentage: 1 },
      process: {
        _id: 1, name: 1,
        steps: {
          _id: 1, name: 1, order: 1, stepType: 1,
          groupsOperator: 1, assigneeGroups: 1,
          approvals: {
            _id: 1, status: 1, comment: 1, decidedAt: 1,
            decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1 },
            unit: { _id: 1, name: 1, head: { _id: 1, first_name: 1, last_name: 1 } }
          }
        }
      },
      stepApprovals: {
        _id: 1, status: 1, comment: 1, decidedAt: 1,
        processStep: { _id: 1, name: 1 },
        unit: { _id: 1, name: 1 },
        decidedBy: { _id: 1, first_name: 1, last_name: 1, position: 1 }
      },
      goodsReceipts: { _id: 1, receiptNumber: 1, items: 1, status: 1 },
      paymentOrders: { _id: 1, title: 1, amount: 1, status: 1, paidAt: 1 },
      tenders: {
        _id: 1, title: 1, status: 1, deadline: 1,
        offers: { _id: 1, price: 1, deliveryTime: 1, status: 1, store: { _id: 1, name: 1 } }
      },
      history: 1,
      postCompletionSteps: 1,
    }
  )

  const pr = result.success ? result.body?.[0] : null

  return <OrgHeadPRDetailClient pr={pr} />
}
