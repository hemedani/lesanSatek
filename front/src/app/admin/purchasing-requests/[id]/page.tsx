import { get } from "@/app/actions/purchasingRequest/get";
import { getHistory } from "@/app/actions/purchasingRequest/getHistory";
import { PurchasingRequestDetailClient } from "./purchasing-request-detail-client";

export default async function PurchasingRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [prResult, historyResult] = await Promise.all([
    get(
      { _id: id },
      {
        _id: 1,
        title: 1,
        description: 1,
        estimatedAmount: 1,
        status: 1,
        currentStep: 1,
        quantity: 1,
        createdAt: 1,
        process: { _id: 1, name: 1, description: 1, steps: { _id: 1, name: 1, order: 1 } },
        budgetLine: { _id: 1, code: 1, title: 1, remainingBudget: 1 },
        requestingUnit: { _id: 1, name: 1 },
        wareModel: { _id: 1, name: 1, enName: 1 },
        history: { action: 1, performed: { by: 1, name: 1, at: 1 } },
      }
    ),
    getHistory({ _id: id }),
  ]);

  const pr = prResult.success ? prResult.body?.[0] : null;
  const history = historyResult.success ? historyResult.body?.[0]?.history : [];

  return (
    <PurchasingRequestDetailClient
      pr={pr}
      history={history || []}
    />
  );
}
