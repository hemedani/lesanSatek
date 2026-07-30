import { gets } from "@/app/actions/stockMovement/gets";
import { StockMovementsClient } from "./stock-movements-client";

export default async function StockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; reason?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;
  const reason = resolvedSearchParams.reason || undefined;

  const result = await gets(
    { activeRoleId: "", page, limit, reason: reason as any },
    {
      _id: 1, quantity: 1, balanceBefore: 1, balanceAfter: 1,
      reason: 1, description: 1, createdAt: 1,
      unit: { _id: 1, name: 1 },
      createdBy: { _id: 1, first_name: 1, last_name: 1 },
      wareModel: { _id: 1, name: 1 },
    }
  );

  const items = result.success ? result.body : [];
  const params = new URLSearchParams();
  if (resolvedSearchParams.reason) params.set("reason", resolvedSearchParams.reason);

  const prevPageUrl = page > 1 ? `/admin/stock-movements?page=${page - 1}&${params.toString()}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/stock-movements?page=${page + 1}&${params.toString()}` : "";

  return (
    <StockMovementsClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
      reasonFilter={resolvedSearchParams.reason || ""}
    />
  );
}
