import { gets } from "@/app/actions/consumption/gets";
import { ConsumptionClient } from "./consumption-client";

export default async function ConsumptionPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 30;

  const result = await gets(
    { activeRoleId: "", page, limit },
    {
      _id: 1, quantity: 1, consumedAt: 1, reason: 1, consumedFor: 1, notes: 1,
      unit: { _id: 1, name: 1 },
      consumedBy: { _id: 1, first_name: 1, last_name: 1 },
      ware: { _id: 1, name: 1 },
      wareModel: { _id: 1, name: 1 },
    }
  );

  const items = result.success ? result.body : [];
  const prevPageUrl = page > 1 ? `/admin/consumption?page=${page - 1}` : "";
  const nextPageUrl = items.length >= limit ? `/admin/consumption?page=${page + 1}` : "";

  return (
    <ConsumptionClient
      items={items}
      prevPageUrl={prevPageUrl}
      nextPageUrl={nextPageUrl}
      page={page}
    />
  );
}
